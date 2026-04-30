import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Mail, BookOpen, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-12 w-full max-w-4xl mx-auto py-12 px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Support Center</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Need help with the trainer? Find documentation, report bugs, or join our community discord.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <MessageCircle className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Join Discord</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The fastest way to get help is to join our official Discord. Talk directly to developers and other players.
            </p>
            <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white">
              Connect to Discord
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Bug className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Report a Bug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found a physics glitch or a UI bug? Open an issue on our tracker so we can squash it as soon as possible.
            </p>
            <Button variant="outline" className="w-full">
              Open Bug Report
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Learn how to customize your training sessions, use the Freeplay Console, and master the advanced physics settings.
            </p>
            <Button variant="secondary" className="w-full">
              View Wiki
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Mail className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              For business inquiries or direct support issues that require privacy, feel free to reach out via email.
            </p>
            <Button variant="ghost" className="w-full">
              support@airdribble.com
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        airdribble is an open-source community project. We typically respond within 24-48 hours.
      </div>
    </div>
  );
}
