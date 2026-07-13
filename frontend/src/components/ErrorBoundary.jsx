import { Component } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw } from "lucide-react";

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-background p-4">
          <Card className="max-w-md w-full border-border">
            <CardContent className="p-8 text-center space-y-4">
              <AlertOctagon className="h-10 w-10 text-rose-500 mx-auto" />
              <h2 className="font-display text-xl font-semibold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
              <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Reload page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
