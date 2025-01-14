import { RequestNetwork } from '@requestnetwork/request-client.js';
import EthereumPrivateKeyCipherProvider from './ehtereum-private-key-cipher-provider';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { Types } from '@requestnetwork/request-client.js';
import { getWebApiBaseUrl } from '../../frontend/lib/env';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { z } from 'zod';

const createRequestSchema = z.custom<Types.ICreateRequestParameters>();

export class RequestService {
  public requestClient: RequestNetwork;
  private signatureProvider: EthereumPrivateKeySignatureProvider;
  private cipherProvider: EthereumPrivateKeyCipherProvider;
  private payeeWallet: ethers.Wallet;
  private static WALLET_PATH = path.join(app.getPath('userData'), 'wallet.json');

  constructor() {
    this.initializeWallet();
    console.log('0xHypr', 'Payee wallet:', this.payeeWallet.privateKey);

    // Initialize the cipher provider with explicit ECIES method
    this.cipherProvider = new EthereumPrivateKeyCipherProvider({
      key: this.payeeWallet.privateKey,
      method: Types.Encryption.METHOD.ECIES,
    });

    console.log('0xHypr', 'Payee wallet:', this.payeeWallet.privateKey);
    this.signatureProvider = new EthereumPrivateKeySignatureProvider({
      privateKey: this.payeeWallet.privateKey,
      method: Types.Signature.METHOD.ECDSA,
    });

    // Initialize the request client with explicit encryption parameters
    this.requestClient = new RequestNetwork({
      
      nodeConnectionConfig: {
        baseURL: process.env.REQUEST_NODE_URL || 'https://xdai.gateway.request.network/',
      },
      cipherProvider: this.cipherProvider,
      signatureProvider: this.signatureProvider,
      useMockStorage: false,
    });
  }

  private initializeWallet() {
    try {
      if (fs.existsSync(RequestService.WALLET_PATH)) {
        const walletData = JSON.parse(fs.readFileSync(RequestService.WALLET_PATH, 'utf8'));
        this.payeeWallet = new ethers.Wallet(walletData.privateKey);
        console.log('0xHypr', 'Loaded existing wallet:', this.payeeWallet.address);
      } else {
        this.payeeWallet = ethers.Wallet.createRandom();
        fs.writeFileSync(
          RequestService.WALLET_PATH,
          JSON.stringify({
            address: this.payeeWallet.address,
            privateKey: this.payeeWallet.privateKey,
          })
        );
        console.log('0xHypr', 'Created new wallet:', this.payeeWallet.address);
      }
    } catch (error) {
      console.error('0xHypr', 'Error initializing wallet:', error);
      this.payeeWallet = ethers.Wallet.createRandom();
    }
  }

  getPayeeAddress(): string {
    return this.payeeWallet.address;
  }

  getPayeePrivateKey(): string {
    return this.payeeWallet.privateKey;
  }

  async getUserRequests() {
    try {
      const requests = await this.requestClient.fromIdentity({
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: this.payeeWallet.address,
      });

      return await Promise.all(
        requests.map(async (request) => {
          const data = await request.getData();
          return {
            requestId: data.requestId,
            amount: ethers.utils.formatUnits(data.expectedAmount, 18),
            currency: data.currency,
            status: data.state,
            timestamp: data.timestamp,
            description: data.contentData?.reason || '',
            payer: data.payer,
            payee: data.payee,
          };
        })
      );
    } catch (error) {
      console.error('0xHypr', 'Failed to get user requests:', error);
      throw error;
    }
  }

  async generateEphemeralKey() {
    const response = await fetch(`${getWebApiBaseUrl()}/ephemeral-keys/generate`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to generate ephemeral key');
    }

    return response.json();
  }

  async createInvoiceRequest(data: any) {
    const parsedData = createRequestSchema.parse(data);

    console.log('0xHypr', 'Parsed data:', parsedData);
    try {
      const { token, publicKey: payerPublicKey } = await this.generateEphemeralKey();



      // Merge business profile with request data
      const requestWithProfile = {
        ...parsedData,
        contentData: {
          ...parsedData.contentData,
          sellerInfo: {
            ...parsedData.contentData.sellerInfo,
          },
        },
      };

      // Create encryption parameters array for both payer and payee
      const encryptionParams = [
        {
          method: Types.Encryption.METHOD.ECIES,
          key: this.payeeWallet.publicKey,
        },
      ];

      console.log('0xHypr', 'encryptionParams', encryptionParams, 'payee wallet', this.payeeWallet.privateKey);
      
      // Prepare request data
      const requestData: Types.ICreateRequestParameters = {
        ...requestWithProfile,
        signer: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: data.payeeIdentity || this.payeeWallet.address,
        },
        topics: [data.payeeIdentity || this.payeeWallet.address],
      };

      // log payer and payee public keys
      console.log('0xHypr', 'Payer public key:', payerPublicKey);
      console.log('0xHypr', 'Payee public key:', this.payeeWallet.publicKey);

      // creating request with private key
      console.log('0xHypr', 'requestData', requestData);
      // print private key
      console.log('0xHypr', 'private key', this.payeeWallet.privateKey);

      const request = await this.requestClient._createEncryptedRequest(requestData, encryptionParams);
      console.log('step before addStakeholders');

      console.log('step after addStakeholders');
      const isPayeeRegistered = await this.cipherProvider.isIdentityRegistered({
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: this.payeeWallet.address,
      });
      console.log('0xHypr', 'isPayeeRegistered', isPayeeRegistered);


      console.log('step before waitForConfirmation');
      await request.waitForConfirmation();
      request.addStakeholders(
        [
          {
            method: Types.Encryption.METHOD.ECIES,
            key: payerPublicKey,
          },
        ],
        {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: data.payeeIdentity || this.payeeWallet.address,
        }
      );
      console.log('step after waitForConfirmation');
      console.log('0xHypr', 'Request created:', request);
      // temp force decryption for test
      // is 
      // Checking Capabilities
// // Check if encryption is available
// const canEncrypt = cipherProvider.isEncryptionAvailable();
// // Check if decryption is available
// const canDecrypt = cipherProvider.isDecryptionAvailable();
// // Check if an identity is registered
// const isRegistered = await cipherProvider.isIdentityRegistered({
// type: 'ethereum_address',
// value: '0x123...'
// });// Some code
        const canEncrypt = this.cipherProvider.isEncryptionAvailable();
        const canDecrypt = this.cipherProvider.isDecryptionAvailable();


        console.log('0xHypr', 'canEncrypt', canEncrypt);
        console.log('0xHypr', 'canDecrypt', canDecrypt);
        // is payee registered after adding to stakeholders
        const isPayeeRegisteredAfterAddingStakeholders = await this.cipherProvider.isIdentityRegistered({
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: this.payeeWallet.address,
        });
        console.log('0xHypr', 'isPayeeRegisteredAfterAddingStakeholders', isPayeeRegisteredAfterAddingStakeholders);

        const isPayerRegistered = await this.cipherProvider.isIdentityRegistered({
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: payerPublicKey,
        });
        console.log('0xHypr', 'isRegistered', isPayerRegistered);

        // decrypt from the requiest id
        const decryptedRequest = await this.requestClient.fromRequestId(request.requestId);
        console.log('0xHypr', 'decryptedRequest', decryptedRequest);

      return {
        requestId: request.requestId,
        token,
        success: true,
      };
    } catch (error) {
      console.error('0xHypr', 'Error creating invoice request:', error);
      throw error;
    }
  }
}
