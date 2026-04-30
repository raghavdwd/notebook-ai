import React, { useState } from "react";
import {
  Search,
  FileText,
  Brain,
  Users,
  Zap,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black">
      <Nav />
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Turn your notes into
            <span className="block">intelligent insights</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-700 max-w-3xl mx-auto">
            Upload your documents, ask questions, and get instant answers.
            AI-powered research assistant that understands your content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/signup")}
              className="bg-black text-white px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              Get Started Free
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
            <a
              href="https://github.com/raghavdwd/notebook-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-black px-8 py-4 text-lg font-semibold hover:bg-black hover:text-white transition-colors flex items-center justify-center"
            >
              View on GitHub
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ✨ 100% Free &amp; Open Source Forever • No Credit Card Required
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why choose NotebookAI?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to transform how you work with
              information
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white border-2 border-black hover:shadow-lg transition-shadow">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Instant Search</h3>
              <p className="text-gray-600">
                Find any information across all your documents instantly with
                AI-powered semantic search.
              </p>
            </div>

            <div className="text-center p-8 bg-white border-2 border-black hover:shadow-lg transition-shadow">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Smart Summaries</h3>
              <p className="text-gray-600">
                Get intelligent summaries and key insights from your documents
                automatically.
              </p>
            </div>

            <div className="text-center p-8 bg-white border-2 border-black hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
              <p className="text-gray-600">
                Share notebooks and collaborate with your team in real-time with
                shared insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-xl text-gray-600">
              Three simple steps to unlock the power of your documents
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Upload Documents</h3>
              <p className="text-gray-600">
                Drop your PDFs, docs, or text files. We support all major
                formats.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">AI Processing</h3>
              <p className="text-gray-600">
                Our AI reads and understands your content, creating a searchable
                knowledge base.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Ask Questions</h3>
              <p className="text-gray-600">
                Chat with your documents and get instant, accurate answers with
                citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to supercharge your research?
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Join thousands of researchers, students, and professionals who trust
            NotebookAI to unlock insights from their documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/signup")}
              className="bg-white text-black px-8 py-4 text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </button>
            <a
              href="https://github.com/raghavdwd/notebook-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white px-8 py-4 text-lg font-semibold hover:bg-white hover:text-black transition-colors inline-block"
            >
              View on GitHub
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            100% Free Forever • Open Source • No Credit Card
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Brain className="h-6 w-6" />
            <span className="text-lg font-bold">NotebookAI</span>
          </div>
          <a
            href="https://github.com/raghavdwd/notebook-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-black"
          >
            GitHub
          </a>
          <div className="text-gray-500 text-sm mt-4 md:mt-0">
            &copy; 2025 NotebookAI. Open source & free forever.
          </div>
        </div>
      </footer>
    </div>
  );
}
