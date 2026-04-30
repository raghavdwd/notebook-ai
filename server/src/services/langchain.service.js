import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import second from '@langchain/'

/**
 * Service for loading PDF documents through LangChain.
 * This returns page-level document chunks that can be embedded and stored.
 */

export const chunkPdf = async (filePath) => {
  // 1. Create a PDF loader for the uploaded file path
  const loader = new PDFLoader(filePath);

  // 2. Load the PDF page by page as LangChain document objects
  const docs = await loader.load();

  // 3. Return the parsed page documents to the upload controller
  return docs;
};
