"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface MemoryBlock {
  id: number
  size: number
  processes: {
    id: number
    size: number
  }[]
  remainingSize: number
}

interface Process {
  id: number
  size: number
  allocated: boolean
  blockId?: number
}

export default function BestFitPage() {
  const [memoryBlocks, setMemoryBlocks] = useState<MemoryBlock[]>([])
  const [processes, setProcesses] = useState<Process[]>([])
  const [newBlockSize, setNewBlockSize] = useState<number>(0)
  const [newProcessSize, setNewProcessSize] = useState<number>(0)
  const [nextProcessId, setNextProcessId] = useState<number>(1)
  const [error, setError] = useState<string>("")

  const addMemoryBlock = () => {
    if (isNaN(newBlockSize) || newBlockSize <= 0) {
      setError("Please enter a valid block size")
      return
    }

    // Create a new standalone memory block
    const newBlock: MemoryBlock = {
      id: memoryBlocks.length > 0 ? Math.max(...memoryBlocks.map((b) => b.id)) + 1 : 1,
      size: newBlockSize,
      processes: [],
      remainingSize: newBlockSize,
    }

    setMemoryBlocks([...memoryBlocks, newBlock])
    setNewBlockSize(0)
    setError("")
  }

  const allocateProcess = () => {
    if (isNaN(newProcessSize) || newProcessSize <= 0) {
      setError("Please enter a valid process size")
      return
    }

    // Find all blocks that can fit the process
    const availableBlocks = memoryBlocks
      .filter((block) => block.remainingSize >= newProcessSize)
      .sort((a, b) => a.remainingSize - b.remainingSize) // Sort by remaining size for best fit

    if (availableBlocks.length === 0) {
      setError("No suitable memory block available for this process")
      return
    }

    // Best fit: choose the smallest block that can fit the process
    const bestFitBlock = availableBlocks[0]

    // Create the new process
    const newProcess: Process = {
      id: nextProcessId,
      size: newProcessSize,
      allocated: true,
      blockId: bestFitBlock.id,
    }

    // Update the memory blocks
    const updatedBlocks = memoryBlocks.map((block) => {
      if (block.id === bestFitBlock.id) {
        return {
          ...block,
          processes: [...block.processes, { id: nextProcessId, size: newProcessSize }],
          remainingSize: block.remainingSize - newProcessSize,
        }
      }
      return block
    })

    setMemoryBlocks(updatedBlocks)
    setProcesses([...processes, newProcess])
    setNextProcessId(nextProcessId + 1)
    setNewProcessSize(0)
    setError("")
  }

  const deallocateProcess = (processId: number) => {
    const process = processes.find((p) => p.id === processId)
    if (!process || !process.allocated) return

    // Free the memory in the block
    const updatedBlocks = memoryBlocks.map((block) => {
      if (block.id === process.blockId) {
        const updatedProcesses = block.processes.filter((p) => p.id !== processId)
        const freedSize = process.size
        return {
          ...block,
          processes: updatedProcesses,
          remainingSize: block.remainingSize + freedSize,
        }
      }
      return block
    })

    // Update the process
    const updatedProcesses = processes.map((p) => {
      if (p.id === processId) {
        return {
          ...p,
          allocated: false,
          blockId: undefined,
        }
      }
      return p
    })

    setMemoryBlocks(updatedBlocks)
    setProcesses(updatedProcesses)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Best Fit Memory Allocation</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="mr-2 h-4 w-4" /> Home
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Memory Configuration</h2>

            <div className="mb-4">
              <Label htmlFor="newBlock">Create Memory Block</Label>
              <div className="flex mt-1">
                <Input
                  id="newBlock"
                  type="number"
                  placeholder="Block size"
                  value={newBlockSize || ""}
                  onChange={(e) => setNewBlockSize(Number.parseInt(e.target.value))}
                  className="mr-2"
                />
                <Button onClick={addMemoryBlock}>
                  <Plus className="h-4 w-4 mr-2" /> Add Block
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="newProcess">Allocate Process</Label>
              <div className="flex mt-1">
                <Input
                  id="newProcess"
                  type="number"
                  placeholder="Process size"
                  value={newProcessSize || ""}
                  onChange={(e) => setNewProcessSize(Number.parseInt(e.target.value))}
                  className="mr-2"
                />
                <Button onClick={allocateProcess}>
                  <Plus className="h-4 w-4 mr-2" /> Allocate
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Memory Blocks and Processes</h2>

            {memoryBlocks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No memory blocks created yet. Add some blocks to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Block ID</TableHead>
                    <TableHead>Memory Block</TableHead>
                    <TableHead>Processes</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memoryBlocks.map((block) => (
                    <TableRow key={block.id}>
                      <TableCell className="font-medium">Block {block.id}</TableCell>
                      <TableCell>{block.size} bytes</TableCell>
                      <TableCell>
                        {block.processes.length > 0 ? (
                          <div className="space-y-1">
                            {block.processes.map((process) => (
                              <div
                                key={process.id}
                                className="flex items-center justify-between bg-blue-50 p-1 rounded"
                              >
                                <span>
                                  P{process.id}: {process.size} bytes
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deallocateProcess(process.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">Empty</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={block.remainingSize > 0 ? "text-green-600" : "text-gray-500"}>
                          {block.remainingSize} bytes
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Process Allocation History</h3>
              {processes.length === 0 ? (
                <p className="text-gray-500">No processes allocated yet</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {processes.map((process) => (
                    <div
                      key={process.id}
                      className={`p-2 rounded-md border ${process.allocated ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">Process {process.id}</span>
                          <span className="ml-2 text-sm">{process.size} bytes</span>
                        </div>
                        <div>
                          {process.allocated ? (
                            <span className="text-xs text-blue-600">Allocated to Block {process.blockId}</span>
                          ) : (
                            <span className="text-xs text-gray-500">Deallocated</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">How Best Fit Works</h2>
          <p className="mb-4">
            The Best Fit algorithm allocates a process to the smallest free memory block that is large enough to hold
            it. This minimizes wasted memory space (internal fragmentation) by finding the closest match.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>When a process requests memory, the algorithm searches all free memory blocks.</li>
            <li>It identifies the smallest block that can accommodate the process.</li>
            <li>
              The process is allocated to this block, and any remaining space becomes available for future allocations.
            </li>
            <li>When a process is deallocated, its memory block becomes available again for future allocations.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
