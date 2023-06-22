import { NextApiRequest, NextApiResponse } from "next";
import { PineconeClient } from "@pinecone-database/pinecone"
import { PineconeStore } from "langchain/vectorstores/pinecone"
import { Crawler, Page } from "crawler";
import { Document } from "langchain/document"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

let client: PineconeClient | null = null

const initPineconeClient = async () => {
       client = new PineconeClient()

      await client.init({
        apiKey: process.env.PINECONE_API_KEY!,
        environment: process.env.PINECONE_ENVIRONMENT!
    })
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
  
    if (
        !process.env.PINECONE_API_KEY ||
        !process.env.PINECONE_ENVIRONMENT ||
        !process.env.PINECONE_INDEX
      ) {
        res.status(500).json({ message: "PINECONE_ENVIRONMENT and PINECONE_API_KEY and PINECONE_INDEX must be set" })
        return
      }

    const { query } = req
    const { urls: urlString, limit } = query 
    const urls = (urlString as string).split(",")
    const crawlLimit = parseInt(limit as string) || 100

    if (!client) {
        await initPineconeClient()
    }

    const index = client!.Index(process.env.PINECONE_INDEX)

    const crawler = new Crawler(urls, crawlLimit, 200)
    const pages = await crawler.start() as Page[]

    const documents = await Promise.all(
        pages.map((page) => {
           const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 100
           })

           const docs = splitter.splitDocuments([
             new Document({
                pageContent: page.text,
                metadata: {
                    url: page.url,
                    text: page.text 
                }
             })
           ])

           return docs
        })
    )

    console.log("Documents length", documents.flat().length)

    await PineconeStore.fromDocuments(
        documents.flat(),
        new OpenAIEmbeddings(),
        { pineconeIndex: index! }
    )

    console.log("Added to Pinecore vectorestore vectors")

    res.status(200).json({ messgae: "Done"})
}