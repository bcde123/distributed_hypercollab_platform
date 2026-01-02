import { Button } from "@/components/ui/button"

export default function FinalCTA() {
  return (
    <section className="px-6 py-20 bg-gradient-to-br from-primary/10 via-accent/5">
      <div className="max-w-4xl mx-auto text-center">

        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Start collaborating smarter — today.
        </h2>

        <p className="text-xl text-muted-foreground mb-10">
          Join teams shipping faster with HyperCollab.
        </p>

        <div className="flex justify-center gap-4">
          <Button size="lg">Get Started Free</Button>
          <Button size="lg" variant="outline">Schedule Demo</Button>
        </div>

      </div>
    </section>
  )
}
