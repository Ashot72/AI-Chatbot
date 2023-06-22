import type { AppProps } from 'next/app'
import { configureAbly } from "@ably-labs/react-hooks"

const prefix = process.env.API_ROOT || ""

const clientId =   
   Math.random().toString(36).substring(2, 15) +
   Math.random().toString(36).substring(2, 15);

configureAbly({
  authUrl: `${prefix}/api/createTokenRequest?clientId=${clientId}`,
  clientId
})

export default function App({ Component, pageProps }: AppProps) {
  return ( 
      <Component {...pageProps} />
  )
}
