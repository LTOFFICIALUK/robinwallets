import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-sm text-[#8b95a3]">404</p>
      <h1 className="mt-2 text-2xl font-semibold">That page is not here</h1>
      <Link href="/" className="mt-6 inline-flex text-sm text-[#CCFF00] hover:underline">
        Go to the tracker
      </Link>
    </main>
  );
}
