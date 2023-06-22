# Multi-User Chatbot with Langchain and Pinecone in Next.JS

This is a Multi-User Chatbot with Langchain and pinecone in Next.JS. The concept of this application is very similar to my Node.js [LangChain Document Helper](https://github.com/Ashot72/LangChain-Documentation-Helper) application. You can read about LangChain, Vector database such as Pinecone, embeddings etc., in the Langchain Document Helper app.

As a cloud-based database, [MongoDB](https://www.mongodb.com/atlas/database) is used with [Prisma ORM](https://www.prisma.io/ ).

We can crawl a single site or multiple sites. The sites can be of the same domain, and the app will not crawl the pages that have already been crawled. You can also specify different domains with commas. In this application I will crawl a single site which is [Lightning Tools](https://lightningtools.com/) the company I work for.

```
Crawling samples

http://localhost:3000/api/crawl?urls=https://lightningtools.com/&limit=1000

http://localhost:3000/api/crawl?urls=https://lightningtools.com/,https://lightningtools.com/about-us&limit=1000

http://localhost:3000/api/crawl?urls=https://lightningtools.com/,https://www.microsoft.com/&limit=1000

```
LLMs are stateless, which means they have no concept of memory. That means that they do not maintain the chain of conversation on their own. We need to build a mechanism that will maintain conversation history that will be part of the context for each response we get back from the chatbox. For that reason, we use [ably](https://ably.com/) 

When you start the chat, you must specify a username. This name should be unique in general, as with this name you can access the entire conversation log and also display it on a screen. In a real app, a user must be authenticated, and username can be their unique email address, ensuring no two users can have the same usernames.

To get started.
```
       Clone the repository

       git clone https://github.com/Ashot72/AI-Chatbot
       cd AI-Chatbot

       Add .env file base on env.example.txt file and add respective keys
       
       # installs dependencies
         npm install

       # to run locally
         npm run dev
      
```

Go to [AI Chatbot Video](https://youtu.be/TkZCDJJrQqw) page

Go to [AI Chatbot Description](https://ashot72.github.io/AI-Chatbot/doc.html) page
