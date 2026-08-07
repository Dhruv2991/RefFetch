"use client";

import { useEffect, useRef, useState } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { fetchGraph, GraphNode, GraphEdge } from "@/lib/api";

type SimNode = GraphNode & { x?: number; y?: number; degree?: number };

const WIDTH = 900;
const HEIGHT = 620;

const PALETTE = [
  { fill: "#D9A441", glow: "#F0C168" },
  { fill: "#4FB6AE", glow: "#7FD8D0" },
  { fill: "#D97878", glow: "#E8A0A0" },
  { fill: "#8FA3D9", glow: "#B0C0EE" },
  { fill: "#A88FD9", glow: "#C7B3EE" },
  { fill: "#7FBF7F", glow: "#A5D9A5" },
];

function colorForTag(tag: string | undefined) {
  if (!tag) return { fill: "#6B7280", glow: "#9CA3AF" };
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function ResearchGraph({ onSelectPaper }: { onSelectPaper: (id: string) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [legendTags, setLegendTags] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchGraph()
      .then((graph) => {
        if (cancelled) return;
        setNodeCount(graph.nodes.length);
        const tags = Array.from(new Set(graph.nodes.map((n) => n.tags[0]).filter(Boolean))) as string[];
        setLegendTags(tags.slice(0, 6));
        setLoading(false);
        renderGraph(graph.nodes, graph.edges);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Failed to load graph");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderGraph(rawNodes: GraphNode[], rawEdges: GraphEdge[]) {
    if (!svgRef.current) return;

    const degree: Record<string, number> = {};
    rawEdges.forEach((e) => {
      degree[e.source] = (degree[e.source] || 0) + 1;
      degree[e.target] = (degree[e.target] || 0) + 1;
    });

    const nodes: SimNode[] = rawNodes.map((n) => ({ ...n, degree: degree[n.id] || 0 }));
    const links = rawEdges.map((e) => ({ ...e }));

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    // --- defs: glow filter + radial background ---
    const defs = svg.append("defs");

    const glow = defs.append("filter").attr("id", "node-glow").attr("x", "-100%").attr("y", "-100%").attr("width", "300%").attr("height", "300%");
    glow.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const bgGradient = defs
      .append("radialGradient")
      .attr("id", "bg-glow")
      .attr("cx", "50%")
      .attr("cy", "45%")
      .attr("r", "65%");
    bgGradient.append("stop").attr("offset", "0%").attr("stop-color", "#1F2530").attr("stop-opacity", 0.9);
    bgGradient.append("stop").attr("offset", "100%").attr("stop-color", "#11151C").attr("stop-opacity", 1);

    svg.append("rect").attr("width", WIDTH).attr("height", HEIGHT).attr("fill", "url(#bg-glow)").attr("rx", 16);

    const container = svg.append("g");

    svg.call(
      zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => container.attr("transform", event.transform)) as any
    );
    svg.call((zoom<SVGSVGElement, unknown>() as any).transform, zoomIdentity);

    const simulation = forceSimulation(nodes as any)
      .force(
        "link",
        forceLink(links as any)
          .id((d: any) => d.id)
          .distance((d: any) => 170 - d.weight * 90)
          .strength((d: any) => 0.3 + d.weight * 0.5)
      )
      .force("charge", forceManyBody().strength(-260))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collide", forceCollide((d: any) => 26 + (d.degree || 0) * 2));

    // curved links with weight-based opacity/width
    const link = container
      .append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "#3A4252")
      .attr("stroke-width", (d: any) => 0.8 + d.weight * 3)
      .attr("stroke-opacity", (d: any) => 0.25 + d.weight * 0.4);

    const node = container
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (_event: any, d: SimNode) => onSelectPaper(d.id))
      .on("mouseenter", function () {
        select(this).select("circle.ring").attr("stroke-opacity", 1);
        select(this).select("circle.core").attr("r", (d: any) => 16 + (d.degree || 0) * 1.5);
      })
      .on("mouseleave", function () {
        select(this).select("circle.ring").attr("stroke-opacity", 0.5);
        select(this).select("circle.core").attr("r", (d: any) => 14 + (d.degree || 0) * 1.5);
      });

    node
      .append("circle")
      .attr("class", "ring")
      .attr("r", (d: SimNode) => 19 + (d.degree || 0) * 1.5)
      .attr("fill", "none")
      .attr("stroke", (d: SimNode) => colorForTag(d.tags[0]).glow)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 1.5);

    node
      .append("circle")
      .attr("class", "core")
      .attr("r", (d: SimNode) => 14 + (d.degree || 0) * 1.5)
      .attr("fill", (d: SimNode) => colorForTag(d.tags[0]).fill)
      .attr("filter", "url(#node-glow)")
      .style("transition", "r 0.15s ease");

    node
      .append("text")
      .text((d: SimNode) => (d.title.length > 16 ? d.title.slice(0, 16) + "…" : d.title))
      .attr("text-anchor", "middle")
      .attr("dy", (d: SimNode) => 34 + (d.degree || 0) * 1.5)
      .attr("fill", "#B8BEC9")
      .attr("font-size", "10.5px")
      .attr("font-weight", "500")
      .style("font-family", "var(--font-sans)")
      .style("pointer-events", "none");

    node.append("title").text((d: SimNode) => d.title);

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.4;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });
      node.attr("transform", (d: SimNode) => `translate(${d.x},${d.y})`);
    });
  }

  return (
    <div className="p-4">
      {loading && (
        <div className="flex flex-col items-center justify-center" style={{ height: HEIGHT }}>
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-paper-faint text-sm">Mapping your library...</p>
        </div>
      )}
      {error && <p className="text-rose text-sm p-4">{error}</p>}
      {!loading && !error && nodeCount === 0 && (
        <p className="text-paper-faint text-sm p-4">Upload some papers to see the graph.</p>
      )}
      {!loading && !error && nodeCount > 0 && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-paper-faint">
            Papers connect when topically similar — larger nodes have more connections. Click to open, scroll to zoom.
          </p>
          {legendTags.length > 0 && (
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {legendTags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-[10px] font-mono text-paper-muted">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: colorForTag(tag).fill }}
                  />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full rounded-2xl border border-hairline"
        style={{ minHeight: HEIGHT }}
      />
    </div>
  );
}
