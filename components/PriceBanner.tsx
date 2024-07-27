"use client";
import React, { useState, useEffect } from 'react';
import { priceMulti } from '../web3/Prices';

const PriceBanner: React.FC = () => {
    const [prices, setPrices] = useState({ ethereum: 0, wcanto: 0, atom: 0 });
    const [initialFetchCompleted, setInitialFetchCompleted] = useState(false);

    useEffect(() => {
        const fetchPrices = async () => {
            const ethPrice = await priceMulti("ethereum");
            const cantoPrice = await priceMulti("wcanto");
            const atomPrice = await priceMulti("atom");
            setPrices({ ethereum: ethPrice, wcanto: cantoPrice, atom: atomPrice });
            setInitialFetchCompleted(true);
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 60000);

        return () => clearInterval(interval);
    }, []);

    const formatPrice = (price: number) => price.toFixed(2);

    const PriceItem = ({ name, price }: { name: string; price: number }) => (
        <div className="flex items-center bg-gray-800 rounded-full px-4 py-1">
            <span className="text-gray-300 font-medium mr-2">{name}:</span>
            <span className="text-green-400 font-bold">${formatPrice(price)}</span>
        </div>
    );

    return (
        <div className="bg-[#001220] py-3 fixed bottom-0 left-0 right-0 z-50 overflow-hidden shadow-lg">
            {!initialFetchCompleted ? (
                <div className="flex justify-center items-center h-full">
                    <div className="text-white">Loading...</div>
                </div>
            ) : (
                <div className="flex whitespace-nowrap animate-marquee">
                    <div className="flex space-x-6 mx-4">
                        <PriceItem name="ETH" price={prices.ethereum} />
                        <PriceItem name="WCANTO" price={prices.wcanto} />
                        <PriceItem name="ATOM" price={prices.atom} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceBanner;
