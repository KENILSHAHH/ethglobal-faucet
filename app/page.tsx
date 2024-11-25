"use client"

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createWalletClient, http, parseEther } from 'viem'
import { polygonAmoy, sepolia } from 'viem/chains'
import Image from "next/image"
import { privateKeyToAccount } from 'viem/accounts'
 
const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;
console.log(PRIVATE_KEY)

const COOLDOWN_PERIOD = 60 * 60 * 1000 

export default function ChainSelector() {
  const [selectedChain, setSelectedChain] = useState<string>('amoy')
  const [recipientAddress, setRecipientAddress] = useState<string>("")
  const [txStatus, setTxStatus] = useState<string>('')
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false)

  useEffect(() => {
    checkCooldown()
  }, [selectedChain, recipientAddress])

  const handleChainChange = (value: string) => {
    setSelectedChain(value)
    setTxStatus('')
    checkCooldown()
  }

  const checkCooldown = () => {
    const lastClaim = localStorage.getItem(`lastClaim_${selectedChain}_${recipientAddress}`)
    if (lastClaim) {
      const timeSinceLastClaim = Date.now() - parseInt(lastClaim)
      if (timeSinceLastClaim < COOLDOWN_PERIOD) {
        const remainingTime = Math.ceil((COOLDOWN_PERIOD - timeSinceLastClaim) / 60000)
        setTxStatus(`Please wait ${remainingTime} minutes before claiming again.`)
        setIsButtonDisabled(true)
      } else {
        setIsButtonDisabled(false)
        setTxStatus('')
      }
    } else {
      setIsButtonDisabled(false)
      setTxStatus('')
    }
  }
  const sendTransaction = async () => {
    if (!recipientAddress) {
      setTxStatus('Please enter a valid address.')
      return
    }
    setTxStatus('Initiating transaction...')
    setIsButtonDisabled(true)
    try {
      const client = createWalletClient({
        account : privateKeyToAccount(`0x${PRIVATE_KEY}`),
        chain: selectedChain === 'amoy' ? polygonAmoy : sepolia,
        transport: http()
      })
      const hash = await client.sendTransaction({
        account: privateKeyToAccount(`0x${PRIVATE_KEY}`),
        to: `0x${recipientAddress.replace(/^0x/, '')}`,
        value: parseEther('0.5')
      })
      setTxStatus(`Transaction sent! Hash: ${hash}`)
      localStorage.setItem(`lastClaim_${selectedChain}_${recipientAddress}`, Date.now().toString())
    } catch (error) {
      setTxStatus(`Error: ${(error as any).message}`)
    } finally {
      checkCooldown()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white p-4">
      <div className="text-primary">
        <Image
          src="https://cryptologos.cc/logos/polygon-matic-logo.png"
          width={100}
          height={100}
          alt='Polygon logo'
        />
      </div>
      <div className="flex w-full max-w-md flex-col gap-4">
        <Select value={selectedChain} onValueChange={handleChainChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a chain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amoy">Polygon Amoy</SelectItem>
            <SelectItem value="sepolia">Ethereum Sepolia</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Enter recipient address"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={sendTransaction} disabled={isButtonDisabled}>
          Send 0.5 {selectedChain === 'amoy' ? 'POL' : 'ETH'}
        </Button>
        {txStatus && <div className="mt-4 text-sm text-gray-600">{txStatus}</div>}
      </div>
    </div>
  )
}

