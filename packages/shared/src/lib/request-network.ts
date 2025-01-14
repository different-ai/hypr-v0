import { RequestNetwork } from '@requestnetwork/request-client.js';
import { Types } from '@requestnetwork/request-client.js';
import EthereumPrivateKeyCipherProvider from '@requestnetwork/epk-cipher';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';

export async function getRequestClient(privateKey: string) {
  // Initialize the cipher provider with explicit ECIES method
  const cipherProvider = new EthereumPrivateKeyCipherProvider({
    key: privateKey,
    method: Types.Encryption.METHOD.ECIES,
  });

  const signatureProvider = new EthereumPrivateKeySignatureProvider({
    privateKey: privateKey,
    method: Types.Signature.METHOD.ECDSA,
  });

  // Initialize the request client with explicit encryption parameters
  return new RequestNetwork({
    nodeConnectionConfig: {
      baseURL: process.env.REQUEST_NODE_URL || 'https://xdai.gateway.request.network/',
    },
    cipherProvider: cipherProvider,
    signatureProvider: signatureProvider,
    useMockStorage: false,
  });
} 