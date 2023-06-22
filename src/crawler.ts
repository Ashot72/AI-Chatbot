//@ts-ignore
import * as Spider from 'node-spider'
import * as cheerio from 'cheerio'
import parse from 'url-parse'
import { stripHtml } from "string-strip-html";

export type Page = {
    url: string
    text: string
}

class Crawler {
    pages: Page[] = []
    limit: number = 1000
    urls: string[] = []
    spider: Spider | null = { }
    count: number = 0
    textLengthMinimum: number = 200

    constructor(urls: string[], limit: number = 1000, textLengthMinimum: number = 200) {
        this.urls = urls
        this.limit = limit
        this.textLengthMinimum = textLengthMinimum

        this.count = 0
        this.pages = []
        this.spider = {}
    }

    handleRequest = (doc: any) => {
        const $ = cheerio.load(doc.res.body)

        $("script").remove();
        $("img").remove();
        $('br').replaceWith('\n')
        $('p').replaceWith('\n')
        const html = $("body").html()
      
        const text = stripHtml(html!).result

        const page: Page = {
            url: doc.url,
            text
        }

        if(text.length > this.textLengthMinimum) {
            this.pages.push(page)
        }

        doc.$("a").each((i: number, elem: any) => {
           var href = doc.$(elem).attr("href")?.split("#")[0]          
           var targetUrl = href && doc.resolve(href)

           //crawl more
           if(targetUrl && this.urls.some(u => {
             const targetUrlParts = parse(targetUrl)
             const uParts = parse(u)

             return targetUrlParts.hostname === uParts.hostname
           }) && this.count < this.limit) {
              this.spider.queue(targetUrl, this.handleRequest)
              this.count = this.count + 1
           }
        })
    }

    start = async () => {
        this.pages = []

        return new Promise((resolve, reject) => {
            this.spider = new Spider({
                concurrent: 5,
                delay: 0,
                allowDuplicates: false,
                catchErrors: true,
                addReferrer: false,
                xhr: false,
                keepAlive: false,
                error: (err: any, url: string) => {
                    console.log(err, url)
                    reject(err)
                },
                // called when there ar no more requests
                done: () => resolve(this.pages),
                headers: { "user-agent": "node-spider" },
                encoding: "utf8"
            })

            this.urls.forEach((url) => {
                this.spider.queue(url, this.handleRequest)
            })
        })
    }
}

export { Crawler }