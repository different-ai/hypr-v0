'use client';

import Link from 'next/link';
import React from 'react';

type BiosContainerProps = {
  children?: React.ReactNode;
};

export function BiosContainer({ children }: BiosContainerProps) {
  return (
    <div
      className="bios-container"
      style={{
        marginBottom: '0',
        maxHeight: '70vh',
        overflow: 'auto',
        color: '#0000aa',
        backgroundColor: '#aaaaaa',
        borderRadius: '4px',
        border: '2px solid #000088',
        fontFamily: 'monospace',
      }}
    >
      <div 
        className="bios-header"
        style={{
          backgroundColor: '#0000aa',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '18px',
        }}
      >
        HYPRSQRL AI BANKING
      </div>

      <div 
        className="bios-nav"
        style={{
          backgroundColor: '#0000aa',
          color: 'white',
          display: 'flex',
        }}
      >
        <div 
          className="bios-nav-item active"
          style={{
            padding: '6px 16px',
            backgroundColor: '#aaaaaa',
            color: '#0000aa',
            fontWeight: 'bold',
          }}
        >
          Main
        </div>
      </div>

      <div 
        className="bios-content"
        style={{
          padding: '16px',
        }}
      >
        <div 
          className="bios-box"
          style={{
            marginBottom: '24px',
            padding: '16px',
            border: '1px solid #0000aa',
          }}
        >
          <h1
            className="main-title"
            style={{
              fontSize: '32px',
              color: '#0000aa',
              textTransform: 'uppercase',
              textAlign: 'center',
              margin: '0 0 16px 0',
            }}
          >
            admin work shouldn't feel like this, but it does.
          </h1>

          <p style={{ margin: '12px 0', lineHeight: '1.5' }}>
            Our goal is to automate the entire financial stack from creating
            invoices to allocating funds, all while staying compliant.
          </p>

          <p style={{ margin: '12px 0', lineHeight: '1.5' }}>
            We're built on crypto rails, and if you're a crypto freelancer,
            you'll be one of the first to benefit from it.
          </p>
        </div>

        {/* Latest Updates Section */}
        <div 
          className="bios-box"
          style={{
            padding: '16px',
            border: '1px solid #0000aa',
          }}
        >
          <h2 
            className="latest-updates-title"
            style={{
              fontSize: '18px',
              color: '#0000aa',
              marginBottom: '16px',
              borderBottom: '1px dashed #0000aa',
              paddingBottom: '8px',
            }}
          >
            Latest Updates - Available Modules:
          </h2>

          <ul 
            className="modules-list"
            style={{
              listStyle: 'none',
              padding: '0',
              margin: '0',
            }}
          >
            <li style={{ marginBottom: '12px', borderLeft: '4px solid #00aaaa', paddingLeft: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#0000aa' }}>APRIL 3, 2024</div>
              <div>
                <span style={{ fontWeight: 'bold' }}>AI Yield Finder:</span>{' '}
                <Link 
                  href={process.env.NODE_ENV === 'production' ? 'https://y.hyprsqrl.com' : 'http://localhost:3060'} 
                  style={{
                    color: '#00aaaa',
                    textDecoration: 'none',
                  }}
                  className="module-link"
                >
                  AI chat to find the best yield opportunities
                </Link>
              </div>
            </li>
            <li style={{ marginBottom: '12px', borderLeft: '4px solid #00aaaa', paddingLeft: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#0000aa' }}>MARCH 15, 2024</div>
              <div>
                <span style={{ fontWeight: 'bold' }}>Crypto Invoicing:</span>{' '}
                <Link 
                  href={process.env.NODE_ENV === 'production' ? 'https://i.hyprsqrl.com' : 'http://localhost:3050'} 
                  style={{
                    color: '#00aaaa',
                    textDecoration: 'none',
                  }}
                  className="module-link"
                >
                  Send invoices and get paid in crypto
                </Link>
              </div>
            </li>
            <li style={{ marginBottom: '0', borderLeft: '4px solid #777777', paddingLeft: '12px', color: '#777777' }}>
              <div style={{ fontWeight: 'bold' }}>ARCHIVED</div>
              <div>
                <span style={{ fontWeight: 'bold', textDecoration: 'line-through' }}>
                  Screen Monitoring App:
                </span>{' '}
                <span>
                  (Discontinued) Electron app that watched your screen to create invoices
                </span>
              </div>
            </li>
          </ul>
        </div>

        {children}
      </div>
    </div>
  );
}

export default BiosContainer; 