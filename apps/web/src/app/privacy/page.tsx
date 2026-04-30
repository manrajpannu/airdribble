import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock, Eye, Bell } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-12 w-full max-w-4xl mx-auto py-12 px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Privacy Policy</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Last updated: April 30, 2026. We value your privacy and are committed to protecting your personal data.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Eye className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            airdribble primarily operates locally in your browser. We do not store personal identification information.
            We may collect anonymous usage statistics (such as session duration or selected scenarios) to help us improve the trainer's performance and accuracy.
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Lock className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Data Security</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            Your settings and training progress are stored locally using browser storage. This data never leaves your device
            unless you explicitly choose to export it. We use industry-standard security measures to ensure that your
            local environment remains safe.
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            We do not sell your data. We may use third-party analytics (like Google Analytics) to understand general traffic patterns,
            which helps us optimize our server resources for the global community.
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Changes to Policy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page
            and updating the "Last updated" date.
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Questions? Contact us through our community Discord.
      </div>
    </div>
  );
}
