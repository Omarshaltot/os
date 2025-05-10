import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Memory & Disk Algorithm Visualizer</h1>
          <p className="text-xl text-gray-600 mb-12">
            Understand how memory allocation and disk scheduling work with interactive visualizations of popular
            algorithms.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Best Fit Algorithm</h2>
                <p className="text-gray-600 mb-6">
                  Allocates the smallest free partition that is big enough to accommodate the process, minimizing wasted
                  memory space.
                </p>
                <Link
                  href="/best-fit"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Try Best Fit <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Second Chance Algorithm</h2>
                <p className="text-gray-600 mb-6">
                  A page replacement algorithm that gives a second chance to pages before replacing them, improving on
                  FIFO.
                </p>
                <Link
                  href="/second-chance"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Try Second Chance <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Disk Scheduling</h2>
                <p className="text-gray-600 mb-6">
                  Visualize disk head movement with SSTF, LOOK, and CLOOK algorithms to optimize disk access patterns.
                </p>
                <Link
                  href="/disk-scheduling"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Try Disk Scheduling <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
