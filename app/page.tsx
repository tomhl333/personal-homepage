import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { Interests } from "@/components/Interests";
import { Journal } from "@/components/Journal";
import { Projects } from "@/components/Projects";
import { WorkNotes } from "@/components/WorkNotes";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <Hero />
      <About />
      <Interests />
      <Journal />
      <Projects />
      <Gallery />
      <WorkNotes />
      <Contact />
    </main>
  );
}
