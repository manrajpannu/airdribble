import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, Zap, Ban } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-12 w-full max-w-4xl mx-auto py-12 px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Terms of Service</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Please read these terms carefully before using the airdribble trainer. By accessing the site, you agree to these conditions.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Zap className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Acceptable Use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            airdribble is provided for personal, non-commercial training purposes. You agree not to use the tool for
            malicious activities, including but not limited to reverse engineering the simulation for the purpose
            of creating cheats or exploits for Rocket League.
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Scale className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Disclaimer of Warranty</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            The software is provided "as is", without warranty of any kind. We do not guarantee that your mechanical
            skills will improve, nor do we take responsibility for any frustration caused by missing high-speed balls.
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Ban className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            The airdribble branding, custom shaders, and training logic are the property of the developers.
            Rocket League assets used within the trainer are the property of Psyonix LLC/Epic Games.
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Termination</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to modify or terminate the service at any time without notice. We are not liable for
            any data loss (local settings) resulting from browser cache clearing or service updates.
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Agreement to these terms is required for continued use of the platform.
      </div>
    </div>
  );
}
