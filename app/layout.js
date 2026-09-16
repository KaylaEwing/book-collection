import { Inter, Happy_Monkey } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import { BooksProvider } from "@/components/BooksProvider";
import "./globals.css";

// Fonts from the Figma design
const inter = Inter({
  subsets: ["latin"],
  weight: ["500", "600", "900"],
  variable: "--font-inter",
  display: "swap",
});

const happyMonkey = Happy_Monkey({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-happy-monkey",
  display: "swap",
});

export const metadata = {
  title: "Book Collection | Kayla Ewing",
  description:
    "Keep track of the books you want to read, are reading, and have finished.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${happyMonkey.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AuthProvider>
          <BooksProvider>
            <Navbar />
            <main id="main">{children}</main>
            <Footer />
          </BooksProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
