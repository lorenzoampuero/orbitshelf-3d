"use client";

import * as React from "react";
import { Box, Download, Plus, Search, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  CountTo,
  CreditCost,
  DataTable,
  Dialog,
  DialogContent,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Field,
  IconButton,
  Input,
  Kbd,
  MotionRoot,
  PageHeader,
  Panel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioCard,
  Rise,
  Segmented,
  Select,
  SheetContent,
  Skeleton,
  Slider,
  SpecLine,
  Stat,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toaster,
  Tooltip,
  TooltipProvider,
  toast,
} from "@/components/ui";

const SWATCHES: Array<[string, string]> = [
  ["bg", "var(--bg)"],
  ["stage", "var(--stage)"],
  ["surface-1", "var(--surface-1)"],
  ["surface-2", "var(--surface-2)"],
  ["surface-3", "var(--surface-3)"],
  ["accent", "var(--accent)"],
  ["accent-fill", "var(--accent-fill)"],
  ["ok", "var(--ok)"],
  ["warn", "var(--warn)"],
  ["danger", "var(--danger)"],
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`k-${title}`} className="space-y-4">
      <h2 id={`k-${title}`} className="border-b border-line pb-2 font-mono text-[13px] uppercase tracking-[0.08em] text-subtle">
        {title}
      </h2>
      {children}
    </section>
  );
}

type Row = { id: string; model: string; tris: number; size: string };
const ROWS: Row[] = [
  { id: "a1", model: "Baby dragon", tris: 60000, size: "1.1 MB" },
  { id: "a2", model: "Black hoodie", tris: 60000, size: "1.4 MB" },
  { id: "a3", model: "Kitchen units", tris: 58000, size: "1.2 MB" },
];

export function KitDemo() {
  const [quality, setQuality] = React.useState<"draft" | "standard" | "high">("standard");
  const [source, setSource] = React.useState("photo");
  const [chip, setChip] = React.useState(true);
  const [credits, setCredits] = React.useState(12);
  const [slider, setSlider] = React.useState([40]);
  const [loading, setLoading] = React.useState(false);

  return (
    <MotionRoot>
      <TooltipProvider>
        <main className="container-page space-y-14 py-12">
          <PageHeader title="UI kit" description="Every component in every state. Development only." actions={<Badge tone="warn">dev</Badge>} />

          <Block title="Tokens">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {SWATCHES.map(([name, value]) => (
                <div key={name} className="space-y-1.5">
                  <div className="h-14 rounded-[var(--radius-field)] border border-line-strong" style={{ background: value }} />
                  <p className="font-mono text-[12px] text-muted">{name}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="font-display text-5xl font-bold leading-none">Sora 700 display</p>
              <p className="text-base">Instrument Sans body text. The quick brown fox jumps over the lazy dog.</p>
              <SpecLine parts={["2.0M → 60K tris", "1.1 MB", "GLB"]} />
              <p className="text-[14px] text-subtle">Subtle text, 14 px and up only.</p>
            </div>
          </Block>

          <Block title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Generate</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">
                <Trash2 aria-hidden="true" className="h-4 w-4" /> Delete
              </Button>
              <Button variant="light">Light</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button
                variant="primary"
                loading={loading}
                onClick={() => {
                  setLoading(true);
                  window.setTimeout(() => setLoading(false), 1500);
                }}
              >
                {loading ? "Generating" : "Loading state"}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg" variant="primary">
                Large
              </Button>
              <IconButton label="Add model">
                <Plus aria-hidden="true" className="h-4 w-4" />
              </IconButton>
              <IconButton label="Download" size="sm" variant="ghost">
                <Download aria-hidden="true" className="h-4 w-4" />
              </IconButton>
              <Tooltip content="Search the library">
                <IconButton label="Search" variant="secondary">
                  <Search aria-hidden="true" className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            </div>
          </Block>

          <Block title="Fields">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Name" htmlFor="k-name" hint="Shown in your library.">
                <Input id="k-name" placeholder="Orange baby dragon" />
              </Field>
              <Field label="Name with an error" htmlFor="k-bad" error="Enter at least 3 characters.">
                <Input id="k-bad" aria-invalid="true" aria-describedby="k-bad-error" defaultValue="ab" />
              </Field>
              <Field label="Engine" htmlFor="k-engine">
                <Select id="k-engine" defaultValue="auto">
                  <option value="auto">Automatic</option>
                  <option value="a">Engine A</option>
                </Select>
              </Field>
              <Field label="Disabled" htmlFor="k-dis">
                <Input id="k-dis" disabled defaultValue="Locked" />
              </Field>
              <Field label="Description" htmlFor="k-desc" className="md:col-span-2">
                <Textarea id="k-desc" placeholder="A round orange baby dragon with small wings, toy style" />
              </Field>
            </div>
            <div className="flex flex-col gap-3">
              <Checkbox label="I have the rights to this image" defaultChecked />
              <Checkbox label="Confirm credit use" />
              <Checkbox label="Disabled option" disabled />
            </div>
            <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Source">
              {[
                ["photo", "Photo", "One product photo"],
                ["multi", "Several photos", "Better coverage"],
                ["text", "Text", "Describe it"],
              ].map(([v, t, d]) => (
                <RadioCard key={v} name="k-source" value={v} checked={source === v} onChange={() => setSource(v)} title={t} description={d} meta={v === "multi" ? "×2" : undefined} />
              ))}
            </div>
            <div className="max-w-sm space-y-2">
              <p className="text-[13px] text-muted">
                Slider: <span className="font-mono tabular-nums text-fg">{slider[0]}</span>
              </p>
              <Slider aria-label="Amount" value={slider} onValueChange={setSlider} max={100} step={1} />
            </div>
          </Block>

          <Block title="Selection and status">
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                label="Quality"
                value={quality}
                onValueChange={setQuality}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "standard", label: "Standard" },
                  { value: "high", label: "High" },
                ]}
              />
              <Chip pressed={chip} onClick={() => setChip((v) => !v)}>
                <Box aria-hidden="true" className="h-3.5 w-3.5" /> Furniture
              </Chip>
              <Chip>Apparel</Chip>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Muted</Badge>
              <Badge tone="accent">In use</Badge>
              <Badge tone="ok" dot>
                Approved
              </Badge>
              <Badge tone="warn" dot>
                Needs review
              </Badge>
              <Badge tone="danger" dot>
                Failed
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <CreditCost amount={12} label="credits" />
              <CreditCost amount={240} />
              <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                Press <Kbd>←</Kbd> <Kbd>→</Kbd> to rotate
              </span>
              <span className="text-sm text-muted">
                Count: <CountTo value={credits} />{" "}
                <Button size="sm" variant="ghost" onClick={() => setCredits((c) => c + 25)}>
                  +25
                </Button>
              </span>
            </div>
          </Block>

          <Block title="Tabs">
            <Tabs defaultValue="recent">
              <TabsList aria-label="Library views">
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
              </TabsList>
              <TabsContent value="recent">
                <p className="text-sm text-muted">Your latest models, with their real status.</p>
              </TabsContent>
              <TabsContent value="examples">
                <p className="text-sm text-muted">Free CC0 examples you can import.</p>
              </TabsContent>
              <TabsContent value="shortcuts">
                <p className="text-sm text-muted">Workspace shortcuts.</p>
              </TabsContent>
            </Tabs>
          </Block>

          <Block title="Cards and data">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4">
                <p className="text-sm font-semibold">Default</p>
                <p className="mt-1 text-[13px] text-muted">Border and surface-1.</p>
              </Card>
              <Card variant="outline" className="p-4">
                <p className="text-sm font-semibold">Outline</p>
                <p className="mt-1 text-[13px] text-muted">Stronger border, no fill.</p>
              </Card>
              <Card variant="feature" interactive className="p-4">
                <p className="text-sm font-semibold">Feature</p>
                <p className="mt-1 text-[13px] text-muted">Lifts on hover.</p>
              </Card>
              <Card variant="planned" className="p-4">
                <p className="text-sm font-semibold">Planned</p>
                <p className="mt-1 text-[13px]">Not built yet: dashed.</p>
              </Card>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Stat label="Credits left" value={<CountTo value={1480} />} hint="Starter plan" />
              <Stat label="Triangles" value="60,000" hint="from 2,000,000" />
              <Stat label="File" value="1.1 MB" hint="GLB" />
            </div>
            <DataTable
              caption="Optimised models"
              rows={ROWS}
              rowKey={(r) => r.id}
              columns={[
                { key: "m", header: "Model", cell: (r) => r.model },
                { key: "t", header: "Triangles", numeric: true, cell: (r) => r.tris.toLocaleString("en-US") },
                { key: "s", header: "Size", numeric: true, cell: (r) => r.size },
                { key: "b", header: "Status", cell: () => <Badge tone="ok">Ready</Badge> },
              ]}
            />
          </Block>

          <Block title="Overlays and feedback">
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Open dialog</Button>
                </DialogTrigger>
                <DialogContent title="Delete this model?" description="It moves to the trash and can be restored for 30 days.">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="danger">Delete</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Open sheet</Button>
                </DialogTrigger>
                <SheetContent title="Filters" description="Narrow the library.">
                  <Field label="Search" htmlFor="k-sheet-q">
                    <Input id="k-sheet-q" />
                  </Field>
                </SheetContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Model</DropdownMenuLabel>
                  <DropdownMenuItem>Open</DropdownMenuItem>
                  <DropdownMenuItem>Download GLB</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem danger>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Popover>
                <PopoverTrigger asChild>
                  <Button>Popover</Button>
                </PopoverTrigger>
                <PopoverContent aria-label="Filters">
                  <p className="text-sm text-muted">A small floating panel for filters.</p>
                </PopoverContent>
              </Popover>
              <Button onClick={() => toast("Saved", { description: "Your changes are in the library." })}>Toast</Button>
              <Toaster />
            </div>
          </Block>

          <Block title="Loading, empty and motion">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Rise>
                <Panel>
                  <p className="text-sm font-semibold">Rise</p>
                  <p className="mt-1 text-[13px] text-muted">Enters with a spring; static with reduced motion.</p>
                </Panel>
              </Rise>
              <EmptyState title="No models yet" description="Make your first model from a photo or a description." action={<Button variant="primary">Create a model</Button>} className="md:col-span-1" />
            </div>
          </Block>
        </main>
      </TooltipProvider>
    </MotionRoot>
  );
}
