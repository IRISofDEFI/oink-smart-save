import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link as LinkIcon, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  /** Sits at the centre of the orbit. Falls back to a brand-gradient orb. */
  center?: React.ReactNode;
  className?: string;
}

export default function RadialOrbitalTimeline({
  timelineData,
  center,
  className,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  // The orbit has to shrink on narrow screens or the nodes fly outside the section.
  const [radius, setRadius] = useState(200);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const w = containerRef.current?.clientWidth ?? 0;
      setRadius(w < 480 ? 125 : w < 768 ? 190 : w < 1024 ? 245 : 290);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Everything scales off the orbit radius so the layout stays proportional.
  const coreSize = radius < 150 ? 120 : radius < 220 ? 170 : radius < 260 ? 200 : 230;
  const nodeSize = radius < 150 ? 44 : 56;
  const iconSize = radius < 150 ? 18 : 24;

  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      setRotationAngle((prev) => Number(((prev + 0.3) % 360).toFixed(3)));
    }, 50);
    return () => clearInterval(timer);
  }, [autoRotate]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const getRelatedItems = (itemId: number): number[] =>
    timelineData.find((item) => item.id === itemId)?.relatedIds ?? [];

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    if (nodeIndex < 0) return;
    setRotationAngle(270 - (nodeIndex / timelineData.length) * 360);
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      if (prev[id]) {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
        return {};
      }

      setActiveNodeId(id);
      setAutoRotate(false);
      setPulseEffect(Object.fromEntries(getRelatedItems(id).map((relId) => [relId, true])));
      centerViewOnNode(id);
      return { [id]: true };
    });
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radian = (angle * Math.PI) / 180;
    // Rounded before they reach the style attribute: the browser re-serializes
    // high-precision floats, which makes SSR and client markup disagree on hydration.
    return {
      x: Math.round(radius * Math.cos(radian)),
      y: Math.round(radius * Math.sin(radian)),
      zIndex: Math.round(100 + 50 * Math.cos(radian)),
      opacity: Number(
        Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))).toFixed(2),
      ),
    };
  };

  const isRelatedToActive = (itemId: number) =>
    activeNodeId !== null && getRelatedItems(activeNodeId).includes(itemId);

  const getStatusStyles = (status: TimelineItem["status"]) => {
    switch (status) {
      case "completed":
        return "border-transparent bg-accent text-accent-foreground";
      case "in-progress":
        return "border-accent/50 bg-accent/15 text-accent";
      default:
        return "border-border bg-card text-muted-foreground";
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={cn("relative flex w-full items-center justify-center overflow-hidden", className)}
    >
      <div
        ref={orbitRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Core */}
        <div
          className="pointer-events-none absolute z-10 flex items-center justify-center"
          style={{ width: coreSize, height: coreSize }}
        >
          <div
            className="absolute rounded-full bg-accent/15 blur-3xl"
            style={{ width: coreSize * 1.6, height: coreSize * 1.6 }}
          />
          <div
            className="absolute animate-ping rounded-full border border-accent/30 opacity-70"
            style={{ width: coreSize * 1.2, height: coreSize * 1.2 }}
          />
          <div
            className="absolute animate-ping rounded-full border border-accent/20 opacity-50"
            style={{ width: coreSize * 1.45, height: coreSize * 1.45, animationDelay: "0.5s" }}
          />
          {center ?? <div className="h-full w-full animate-pulse rounded-full bg-gradient-brand" />}
        </div>

        {/* Orbit rings */}
        <div
          className="absolute rounded-full border border-accent/20"
          style={{ width: radius * 2, height: radius * 2 }}
        />
        <div
          className="absolute rounded-full border border-dashed border-border"
          style={{ width: radius * 2 * 0.72, height: radius * 2 * 0.72 }}
        />

        {timelineData.map((item, index) => {
          const position = calculateNodePosition(index, timelineData.length);
          const isExpanded = Boolean(expandedItems[item.id]);
          const isRelated = isRelatedToActive(item.id);
          const isPulsing = Boolean(pulseEffect[item.id]);
          const Icon = item.icon;
          const halo = item.energy * 0.5 + nodeSize;

          return (
            <div
              key={item.id}
              className="absolute cursor-pointer transition-all duration-700"
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                zIndex: isExpanded ? 200 : position.zIndex,
                opacity: isExpanded ? 1 : position.opacity,
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleItem(item.id);
              }}
            >
              <div
                className={cn("absolute -inset-1 rounded-full", isPulsing && "animate-pulse")}
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in oklab, var(--brand-green) 25%, transparent) 0%, transparent 70%)",
                  width: halo,
                  height: halo,
                  left: -((halo - nodeSize) / 2),
                  top: -((halo - nodeSize) / 2),
                }}
              />

              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2 transition-all duration-300",
                  isExpanded
                    ? "scale-125 border-accent bg-accent text-accent-foreground glow-blue"
                    : isRelated
                      ? "animate-pulse border-accent bg-accent/50 text-accent-foreground"
                      : "border-accent/40 bg-card text-accent hover:border-accent hover:glow-blue",
                )}
                style={{ width: nodeSize, height: nodeSize }}
              >
                <Icon size={iconSize} />
              </div>

              <div
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold tracking-tight transition-all duration-300",
                  isExpanded ? "scale-110 text-accent" : "text-foreground/80",
                )}
                style={{ top: nodeSize + 10 }}
              >
                {item.title}
              </div>

              {isExpanded && (
                <Card
                  className="absolute left-1/2 w-72 -translate-x-1/2 overflow-visible border-accent/30 bg-card/95 shadow-xl backdrop-blur-lg glow-blue"
                  style={{ top: nodeSize + 44 }}
                >
                  <div className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-border" />
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className={cn("px-2 text-xs", getStatusStyles(item.status))}>
                        {item.status === "completed"
                          ? "LIVE"
                          : item.status === "in-progress"
                            ? "IN PROGRESS"
                            : "PLANNED"}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    <CardTitle className="mt-2 text-sm">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                    <p className="leading-relaxed">{item.content}</p>

                    <div className="mt-4 border-t border-border pt-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center">
                          <Zap size={10} className="mr-1" />
                          Progress
                        </span>
                        <span className="font-mono">{item.energy}%</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-gradient-brand"
                          style={{ width: `${item.energy}%` }}
                        />
                      </div>
                    </div>

                    {item.relatedIds.length > 0 && (
                      <div className="mt-4 border-t border-border pt-3">
                        <div className="mb-2 flex items-center">
                          <LinkIcon size={10} className="mr-1 text-muted-foreground" />
                          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Connected
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.relatedIds.map((relatedId) => {
                            const relatedItem = timelineData.find((i) => i.id === relatedId);
                            return (
                              <Button
                                key={relatedId}
                                variant="outline"
                                size="sm"
                                className="flex h-6 items-center px-2 py-0 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleItem(relatedId);
                                }}
                              >
                                {relatedItem?.title}
                                <ArrowRight size={8} className="ml-1" />
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
