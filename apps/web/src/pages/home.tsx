import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-4">Welcome to PMS</h1>
      <p className="mb-4 text-muted-foreground">This is the home page.</p>
      <Button>Shadcn Button</Button>
    </div>
  )
}
