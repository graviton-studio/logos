import { Button } from "@/components/ui/button";
import { integrations } from "@/config/integrations";

export function IntegrationsSlider() {
  return (
    <section className="py-16 bg-background border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 md:px-16 mb-12 text-center">
        <h2 className="text-3xl font-bold mb-4 text-primary">
          Seamlessly integrate with your favorite tools
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Logos connects with 100+ apps and services to automate your workflows
        </p>
      </div>

      {/* First slider row - moving left to right */}
      <div className="relative">
        <div className="flex animate-scrollX">
          {/* First set of logos */}
          <div className="flex space-x-20 px-10">
            {integrations.slice(0, 6).map((integration, index) => (
              <div
                key={`first-${index}`}
                className="flex flex-col items-center justify-center w-28 h-28 bg-card rounded-xl shadow-md border border-border p-4 transition-all duration-300 hover:scale-110 hover:shadow-primary/20"
              >
                <integration.icon
                  className={`w-12 h-12 ${integration.color}`}
                />
                <span className="mt-2 text-sm text-muted-foreground">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>

          {/* Second set (duplicate for infinite scroll effect) */}
          <div className="flex space-x-20 px-10">
            {integrations.slice(0, 6).map((integration, index) => (
              <div
                key={`second-${index}`}
                className="flex flex-col items-center justify-center w-28 h-28 bg-card rounded-xl shadow-md border border-border p-4 transition-all duration-300 hover:scale-110 hover:shadow-primary/20"
              >
                <integration.icon
                  className={`w-12 h-12 ${integration.color}`}
                />
                <span className="mt-2 text-sm text-muted-foreground">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second slider row - moving right to left */}
      <div className="relative mt-8">
        <div className="flex animate-scrollXReverse">
          {/* First set of logos */}
          <div className="flex space-x-20 px-10">
            {integrations.slice(6).map((integration, index) => (
              <div
                key={`third-${index}`}
                className="flex flex-col items-center justify-center w-28 h-28 bg-card rounded-xl shadow-md border border-border p-4 transition-all duration-300 hover:scale-110 hover:shadow-primary/20"
              >
                <integration.icon
                  className={`w-12 h-12 ${integration.color}`}
                />
                <span className="mt-2 text-sm text-muted-foreground">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>

          {/* Second set (duplicate for infinite scroll effect) */}
          <div className="flex space-x-20 px-10">
            {integrations.slice(6).map((integration, index) => (
              <div
                key={`fourth-${index}`}
                className="flex flex-col items-center justify-center w-28 h-28 bg-card rounded-xl shadow-md border border-border p-4 transition-all duration-300 hover:scale-110 hover:shadow-primary/20"
              >
                <integration.icon
                  className={`w-12 h-12 ${integration.color}`}
                />
                <span className="mt-2 text-sm text-muted-foreground">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center mt-12">
        <Button
          variant="default"
          className="px-8 py-3 text-base rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
        >
          View all integrations
        </Button>
      </div>
    </section>
  );
}
