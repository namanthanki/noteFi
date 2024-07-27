"use client";
import React, { useState, useEffect } from 'react';
import { getOptions, onBuy, OptionData } from './interactions';
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react';
import LoadingScreen from "@/components/LoadingScreen";

interface GroupedOptions {
  [key: string]: OptionData[];
}

interface OptionTableProps {
  options: OptionData[];
  type: 'call' | 'put';
  onBuyClick: (contractAddr: string, isCall: boolean) => Promise<void>;
}

const OptionTable: React.FC<OptionTableProps> = ({ options, type, onBuyClick }) => {
  const [selectedToken, setSelectedToken] = useState<string>('');

  const groupedOptions: GroupedOptions = options.reduce((acc: GroupedOptions, option) => {
    if (!acc[option.tokenImg]) acc[option.tokenImg] = [];
    acc[option.tokenImg].push(option);
    return acc;
  }, {});

  const tokens = Object.keys(groupedOptions);

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <select
          className="bg-gray-700 text-white px-4 py-2 rounded"
          onChange={(e) => setSelectedToken(e.target.value)}
          value={selectedToken}
        >
          <option value="">All Tokens</option>
          {tokens.map(token => (
            <option key={token} value={token}>{token}</option>
          ))}
        </select>
      </div>

      {tokens.map(token => {
        if (selectedToken && selectedToken !== token) return null;

        return (
          <div key={token} className="mb-8">
            <h3 className="text-xl font-bold mb-2 flex items-center">
              {token.split('/').pop()?.split('.')[0]} Options
            </h3>
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-gray-700">
                <tr>
                  <th className="px-4 py-2">Strike Price</th>
                  <th className="px-4 py-2">Premium</th>
                  <th className="px-4 py-2">Expiration</th>
                  <th className="px-4 py-2">Quantity</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {groupedOptions[token].map((option, index) => (
                  <tr key={index} className={`border-b border-gray-700 ${getTokenColor(token)}`}>
                    <td className="px-4 py-2">${option.strikePrice}</td>
                    <td className="px-4 py-2">${option.premium}</td>
                    <td className="px-4 py-2">{option.expirationDate}</td>
                    <td className="px-4 py-2">{option.quantity}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => onBuyClick(option.contractAddr, type === 'call')}
                        className={`px-3 py-1 rounded text-white text-sm ${type === 'call' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                      >
                        Buy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

const getTokenColor = (token: string): string => {
  const colors: { [key: string]: string } = {
    can: 'bg-orange-900 bg-opacity-10',
    eth: 'bg-blue-900 bg-opacity-10',
    atom: 'bg-green-900 bg-opacity-10',
  };
  return colors[token] || '';
};

const Page: React.FC = () => {
  const { address, chainId, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [optionsData, setOptionsData] = useState<{ calls: OptionData[], puts: OptionData[] }>({
    calls: [],
    puts: []
  });
  const [activeTab, setActiveTab] = useState<'call' | 'put'>('call');

  useEffect(() => {
    if (walletProvider) {
      fetchOptions();
    } else {
      alert("Error: Connect Wallet");
    }
  }, [isConnected, walletProvider, chainId, address]);

  const fetchOptions = async () => {
    setLoading(true);
    setLoadingMessage("Fetching Options...");
    try {
      if (!isConnected) throw "Connect Wallet";
      const data: any = await getOptions(address, walletProvider, chainId);
      setOptionsData(data);
    } catch (error) {
      alert("Error: " + error);
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }

  const onBuyClick = async (contractAddr: string, isCall: boolean) => {
    setLoading(true);
    setLoadingMessage("Processing purchase, please confirm (2) transactions...");
    try {
      if (!isConnected) throw "Connect Wallet";
      await onBuy(walletProvider, chainId, contractAddr, isCall);
      setLoadingMessage("Updating options...");
      await fetchOptions();
    } catch (error) {
      alert("Error: " + error);
      console.error("Failed to buy option:", error);
      setLoadingMessage("Failed to process transaction, please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white'>
      {loading ? (
        <LoadingScreen message={loadingMessage} />
      ) : (
        <div className='max-w-6xl mx-auto p-8'>
          <h1 className="text-3xl font-bold text-center mb-8">Options Trading</h1>

          <div>
            <button
              className={`px-4 py-2 mr-2 rounded-t-lg ${activeTab === 'call' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setActiveTab('call')}
            >
              Call Options
            </button>
            <button
              className={`px-4 py-2 rounded-t-lg ${activeTab === 'put' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setActiveTab('put')}
            >
              Put Options
            </button>
          </div>

          <div className="bg-gray-800 rounded-b-lg p-4">
            {activeTab === 'call' ? (
              <OptionTable options={optionsData.calls} type="call" onBuyClick={onBuyClick} />
            ) : (
              <OptionTable options={optionsData.puts} type="put" onBuyClick={onBuyClick} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Page;