import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import AppLayout from '@/components/layout/AppLayout';
import Head from 'next/head';

// Runtime error reporter
if (typeof window !== 'undefined') {
  const reportUrl = process.env.NEXT_PUBLIC_RUNTIME_ERROR_REPORT_URL;
  const getAppId = () => {
    if (process.env.NEXT_PUBLIC_APP_ID) return process.env.NEXT_PUBLIC_APP_ID;
    const m = window.location.hostname.match(/^preview-([^.]+)\./);
    return m ? m[1] : undefined;
  };
  const report = (message: string, stack?: string) => {
    if (!reportUrl) return;
    fetch(reportUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: getAppId(), message, stack, url: window.location.href, user_agent: navigator.userAgent }),
    }).catch(() => {});
  };
  window.onerror = (msg, _src, _line, _col, err) => { report(String(msg), err?.stack); };
  window.onunhandledrejection = (e) => { report(e.reason?.message || String(e.reason), e.reason?.stack); };
  const origError = console.error;
  console.error = (...args: any[]) => { report(args.map(String).join(' ')); origError.apply(console, args); };
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Savorra — Meal Planner</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </>
  );
}