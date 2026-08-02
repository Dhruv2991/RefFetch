"use client";

import { useEffect, useRef, useState } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { fetchGraph, GraphNode, GraphEdge } from "@/lib/api";

type SimNode = GraphNode & { x?: number; y?: number; fx?: number | null; fy?: number | null };

const WIDTH = 760;
const HEIGHT = 560;

const COLORS = ["#D9A441", "#4FB6AE", "#D97878", "#8FA3D9", "#A88FD9", "#7FBF7F"];

function colorForTag(tag: string | undefined): string {
  if (!tag) return "#9ca3af";
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function ResearchGraph({ onSelectPaper }: { onSelectPaper: (id: string) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchGraph()
      .then((graph) => {
        if (cancelled) return;
        setNodeCount(graph.nodes.length);
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

    const nodes: SimNode[] = rawNodes.map((n) => ({ ...n }));
    const links = rawEdges.map((e) => ({ ...e }));

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const container = svg.append("g");

    svg.call(
      zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => container.attr("transform", event.transform)) as any
    );
    svg.call(
      (zoom<SVGSVGElement, unknown>() as any).transform,
      zoomIdentity
    );

    const simulation = forceSimulation(nodes as any)
      .force(
        "link",
        forceLink(links as any)
          .id((d: any) => d.id)
          .distance((d: any) => 160 - d.weight * 80)
      )
      .force("charge", forceManyBody().strength(-220))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collide", forceCollide(38));

    const link = container
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#262D3A")
      .attr("stroke-width", (d: any) => 1 + d.weight * 3)
      .attr("stroke-opacity", 0.6);

    const node = container
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (_event: any, d: SimNode) => onSelectPaper(d.id));

    node
      .append("circle")
      .attr("r", 22)
      .attr("fill", (d: SimNode) => colorForTag(d.tags[0]))
      .attr("stroke", "#11151C")
      .attr("stroke-width", 2);

    node
      .append("text")
      .text((d: SimNode) => (d.title.length > 14 ? d.title.slice(0, 14) + "…" : d.title))
      .attr("text-anchor", "middle")
      .attr("dy", 38)
      .attr("fill", "#9298A3")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-sans)");

    node.append("title").text((d: SimNode) => d.title);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: SimNode) => `translate(${d.x},${d.y})`);
    });
  }

  return (
    <div>
      {loading && <p className="text-paper-faint text-sm p-4">Loading graph...</p>}
      {error && <p className="text-rose text-sm p-4">{error}</p>}
      {!loading && !error && nodeCount === 0 && (
        <p className="text-paper-faint text-sm p-4">Upload some papers to see the graph.</p>
      )}
      {!loading && !error && nodeCount > 0 && (
        <p className="text-xs text-paper-faint px-4 pt-3">
          Papers connect when their content is topically similar. Click a node to open that paper. Scroll to zoom,
          drag background to pan.
        </p>
      )}
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ minHeight: HEIGHT }} />
    </div>
  );
}
