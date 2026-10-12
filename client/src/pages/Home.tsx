import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { listSavedBuilds, removeSavedBuild, saveBuild, type SavedBuild } from "@/lib/localBuilds";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  FolderOpen,
  ImagePlus,
  Info,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Palette,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

type WrapColor = { id: string; name: string; hex: string; className: string };

const wrapColors: WrapColor[] = [
  { id: "obsidian", name: "Obsidian", hex: "#202225", className: "bg-[#202225]" },
  { id: "porcelain", name: "Porcelain", hex: "#e8e5df", className: "bg-[#e8e5df]" },
  { id: "evergreen", name: "Evergreen", hex: "#24483d", className: "bg-[#24483d]" },
  { id: "amethyst", name: "Amethyst", hex: "#714f82", className: "bg-[#714f82]" },
  { id: "glacier", name: "Glacier", hex: "#8eafc0", className: "bg-[#8eafc0]" },
  { id: "copper", name: "Copper", hex: "#b56a45", className: "bg-[#b56a45]" },
  { id: "crimson", name: "Crimson", hex: "#9d3039", className: "bg-[#9d3039]" },
  { id: "graphite", name: "Graphite", hex: "#62686c", className: "bg-[#62686c]" },
];

const finishes = [
  { id: "gloss", name: "Gloss" },
  { id: "satin", name: "Satin" },
  { id: "matte", name: "Matte" },
  { id: "metallic", name: "Metallic" },
];

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_CANVAS_SIDE = 2200;

function fileToPreviewDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, MAX_CANVAS_SIDE / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("This browser could not prepare the photo."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error("This photo could not be processed. Try another image."));
            return;
          }
          const outputReader = new FileReader();
          outputReader.onload = () => resolve(String(outputReader.result));
          outputReader.onerror = () => reject(new Error("This photo could not be read."));
          outputReader.readAsDataURL(blob);
        }, "image/jpeg", 0.84);
      };
      image.onerror = () => reject(new Error("This file is not a readable image."));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("This photo could not be read."));
    reader.readAsDataURL(file);
  });
}

function EmptyCarIllustration() {
  return (
    <svg viewBox="0 0 760 300" role="img" aria-label="Illustration of a car waiting for a wrap preview" className="w-full max-w-[660px] opacity-55">
      <defs>
        <linearGradient id="body" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#c3c9cc" stopOpacity=".55" />
          <stop offset="1" stopColor="#687176" stopOpacity=".2" />
        </linearGradient>
        <linearGradient id="floor" x1="0" x2="1">
          <stop offset="0" stopColor="#a1aaa8" stopOpacity="0" />
          <stop offset=".5" stopColor="#a1aaa8" stopOpacity=".32" />
          <stop offset="1" stopColor="#a1aaa8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="380" cy="243" rx="286" ry="18" fill="url(#floor)" />
      <path d="M120 202h45l28-48c14-23 31-37 59-42l91-14c24-4 46 4 62 21l43 44 79 16c20 4 34 20 34 40v12H112v-9c0-11 3-20 8-20Z" fill="url(#body)" stroke="#e6eceb" strokeOpacity=".72" strokeWidth="2" />
      <path d="m259 114 85-13c19-3 35 2 49 17l35 40H222l20-31c5-7 10-11 17-13Z" fill="#121719" fillOpacity=".76" stroke="#d9e1df" strokeOpacity=".4" />
      <path d="m352 103-9 55m-122 0h257m-315 37h48m370 0h49" stroke="#d7dfdc" strokeOpacity=".46" strokeWidth="2" />
      <path d="M151 179c16-2 28-3 43-2m350 2 32 9" stroke="#e6bd85" strokeOpacity=".65" strokeWidth="4" strokeLinecap="round" />
      <circle cx="243" cy="222" r="36" fill="#131719" stroke="#aab3b3" strokeOpacity=".8" strokeWidth="3" />
      <circle cx="243" cy="222" r="19" fill="#31393a" stroke="#d9dfdd" strokeOpacity=".58" strokeWidth="2" />
      <circle cx="243" cy="222" r="5" fill="#c7cfcd" />
      <circle cx="518" cy="222" r="36" fill="#131719" stroke="#aab3b3" strokeOpacity=".8" strokeWidth="3" />
      <circle cx="518" cy="222" r="19" fill="#31393a" stroke="#d9dfdd" strokeOpacity=".58" strokeWidth="2" />
      <circle cx="518" cy="222" r="5" fill="#c7cfcd" />
    </svg>
  );
}

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [selectedColorId, setSelectedColorId] = useState("evergreen");
  const [selectedFinish, setSelectedFinish] = useState("satin");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{ colorName: string; finish: string } | null>(null);
  const [comparison, setComparison] = useState(52);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showBuilds, setShowBuilds] = useState(false);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [buildName, setBuildName] = useState("My wrap concept");
  const [savedMessage, setSavedMessage] = useState("");

  const generateMutation = trpc.visualizer.generatePreview.useMutation();
  const selectedColor = useMemo(
    () => wrapColors.find(color => color.id === selectedColorId) ?? wrapColors[2],
    [selectedColorId],
  );

  useEffect(() => {
    listSavedBuilds().then(builds => setSavedBuilds(builds)).catch(() => undefined);
  }, []);

  async function handleFile(file?: File) {
    if (!file) return;
    setErrorMessage("");
    setSavedMessage("");
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setErrorMessage("Choose a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorMessage("That file is over 12 MB. Choose a smaller photo and try again.");
      return;
    }
    try {
      const dataUrl = await fileToPreviewDataUrl(file);
      setSourceDataUrl(dataUrl);
      setFileName(file.name);
      setPreviewUrl(null);
      setPreviewMeta(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn't prepare this photo.");
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  async function createPreview() {
    if (!sourceDataUrl) {
      setErrorMessage("Upload a car photo before generating a preview.");
      return;
    }
    if (!isAuthenticated) {
      setErrorMessage("Sign in to generate an AI preview. Sign in before uploading if you don't want to reselect your photo afterward.");
      return;
    }
    setErrorMessage("");
    setSavedMessage("");
    try {
      const result = await generateMutation.mutateAsync({
        imageDataUrl: sourceDataUrl,
        colorId: selectedColorId as "obsidian" | "porcelain" | "evergreen" | "amethyst" | "glacier" | "copper" | "crimson" | "graphite",
        finish: selectedFinish as "gloss" | "satin" | "matte" | "metallic",
        additionalNotes: additionalNotes.trim() || undefined,
      });
      setPreviewUrl(result.imageUrl);
      setPreviewMeta({ colorName: selectedColor.name, finish: selectedFinish });
      setComparison(52);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn't generate this preview. Please try again.");
    }
  }

  async function handleSaveBuild() {
    if (!sourceDataUrl || !previewUrl) return;
    const build: SavedBuild = {
      id: crypto.randomUUID(),
      name: buildName.trim() || "Untitled wrap concept",
      sourceDataUrl,
      previewUrl,
      colorId: selectedColorId,
      colorName: selectedColor.name,
      finish: selectedFinish,
      notes: additionalNotes,
      savedAt: Date.now(),
    };
    try {
      await saveBuild(build);
      setSavedBuilds(await listSavedBuilds());
      setSavedMessage("Saved in this browser");
    } catch {
      setErrorMessage("This browser couldn't save the build. Check available storage and try again.");
    }
  }

  async function openBuild(build: SavedBuild) {
    setSourceDataUrl(build.sourceDataUrl);
    setPreviewUrl(build.previewUrl);
    setPreviewMeta({ colorName: build.colorName, finish: build.finish });
    setSelectedColorId(build.colorId);
    setSelectedFinish(build.finish);
    setAdditionalNotes(build.notes);
    setBuildName(build.name);
    setFileName("Saved build photo");
    setShowBuilds(false);
    setErrorMessage("");
    setSavedMessage("");
  }

  async function deleteBuild(id: string) {
    try {
      await removeSavedBuild(id);
      setSavedBuilds(await listSavedBuilds());
    } catch {
      setErrorMessage("Couldn't remove this saved entry from the browser.");
    }
  }

  function resetStudio() {
    setSourceDataUrl(null);
    setFileName("");
    setPreviewUrl(null);
    setPreviewMeta(null);
    setAdditionalNotes("");
    setErrorMessage("");
    setSavedMessage("");
    setBuildName("My wrap concept");
  }

  const isGenerating = generateMutation.isPending;

  return (
    <div className="min-h-screen bg-[#f4f3ef] text-[#202321] selection:bg-[#bdd3c8] selection:text-[#18201b]">
      <header className="sticky top-0 z-30 border-b border-black/[0.07] bg-[#f7f6f2]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between px-4 sm:px-7 lg:px-10">
          <a href="/" className="flex items-center gap-3" aria-label="Vanta Studio home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1f2924] text-[#d9e5db]"><span className="text-[19px] font-semibold tracking-[-.11em]">V</span></span>
            <span className="leading-none"><span className="block text-[13px] font-semibold tracking-[.19em]">VANTA</span><span className="mt-1 block text-[9px] font-medium tracking-[.24em] text-[#8a8c87]">AUTO STUDIO</span></span>
          </a>
          <div className="hidden items-center gap-2 text-[11px] font-medium tracking-[.14em] text-[#898b86] md:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#71907a]" /> DESIGN BAY <span className="mx-1 text-[#c3c3bd]">/</span> CONCEPT BUILDER</div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button onClick={() => setShowBuilds(value => !value)} className="flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 text-xs font-medium transition hover:bg-white" aria-expanded={showBuilds}>
                <FolderOpen size={15} strokeWidth={1.8} /><span className="hidden sm:inline">My builds</span><span className="grid h-[19px] min-w-[19px] place-items-center rounded-full bg-[#eaeae4] px-1 text-[10px]">{savedBuilds.length}</span><ChevronDown size={13} className="text-[#8e908b]" />
              </button>
              {showBuilds && <div className="absolute right-0 top-12 z-40 w-[min(340px,calc(100vw-32px))] rounded-2xl border border-black/10 bg-white p-3 shadow-[0_20px_60px_rgba(25,30,27,.18)]">
                <div className="flex items-center justify-between px-1 pb-2"><p className="text-xs font-semibold">Saved on this device</p><button onClick={() => setShowBuilds(false)} aria-label="Close saved builds"><X size={15} /></button></div>
                {savedBuilds.length === 0 ? <div className="rounded-xl bg-[#f5f5f1] px-3 py-5 text-center text-xs text-[#858780]">Your saved concepts will appear here.</div> : <div className="max-h-[340px] space-y-2 overflow-auto">{savedBuilds.map(build => <div key={build.id} className="flex items-center gap-3 rounded-xl border border-black/[.06] p-2">
                  <button onClick={() => void openBuild(build)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><img src={build.previewUrl} alt="" className="h-12 w-16 rounded-lg bg-[#e9e9e4] object-cover" /><span className="min-w-0"><span className="block truncate text-xs font-semibold">{build.name}</span><span className="mt-1 block truncate text-[10px] text-[#858780]">{build.colorName} · {build.finish}</span></span></button>
                  <button onClick={() => void deleteBuild(build.id)} className="rounded-lg p-2 text-[#9b635d] hover:bg-[#f6eeeb]" aria-label={`Remove ${build.name} from this device`}><X size={15} /></button>
                </div>)}</div>}
                <p className="mt-3 border-t border-black/[.06] px-1 pt-2 text-[10px] leading-4 text-[#8b8d87]">Build records are stored in this browser. Removing a record only removes its local reference.</p>
              </div>}
            </div>
            {authLoading ? <span className="grid h-10 w-10 place-items-center text-[#878983]" aria-label="Checking sign-in"><LoaderCircle size={16} className="animate-spin" /></span> : isAuthenticated ? <div className="flex h-10 items-center gap-2 rounded-full bg-[#e9e9e3] pl-1.5 pr-3 text-xs font-medium"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#34463b] text-[10px] font-semibold text-white">{(user?.name ?? "D").slice(0, 1).toUpperCase()}</span><span className="hidden max-w-[110px] truncate sm:inline">{user?.name?.split(" ")[0] ?? "Designer"}</span></div> : <button onClick={() => startLogin()} className="flex h-10 items-center gap-2 rounded-full bg-[#27352d] px-4 text-xs font-semibold text-white transition hover:bg-[#3a4a40]"><LogIn size={14} /> Sign in</button>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-7 sm:pt-9 lg:px-10 lg:pt-11">
        <section className="mb-7 flex flex-col justify-between gap-5 sm:mb-9 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[.19em] text-[#819083]"><span className="h-px w-6 bg-[#8da093]" /> PERSONALIZATION, REIMAGINED</div>
            <h1 className="max-w-[670px] text-[32px] font-medium leading-[1.05] tracking-[-.055em] text-[#202521] sm:text-[42px]">See your next <span className="font-[450] italic text-[#68806f]">move.</span></h1>
            <p className="mt-3 max-w-[600px] text-sm leading-6 text-[#7d8079]">Explore a fresh wrap direction on your own car. Bring a photo, choose a finish, and shape the idea.</p>
          </div>
          <button onClick={resetStudio} className="flex h-10 w-fit items-center gap-2 rounded-full border border-black/10 bg-white/65 px-4 text-xs font-medium transition hover:bg-white"><RotateCcw size={14} /> Start a new build</button>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)] xl:gap-6">
          <aside className="order-2 rounded-[24px] border border-black/[.07] bg-white/80 p-5 shadow-[0_8px_36px_rgba(30,37,31,.035)] sm:p-6 xl:order-1">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-semibold tracking-[.15em] text-[#898c84]">BUILD SETTINGS</p><p className="mt-1 text-base font-semibold tracking-[-.025em]">Your wrap concept</p></div><span className="grid h-9 w-9 place-items-center rounded-full bg-[#eef1eb] text-[#667b68]"><Palette size={16} /></span></div>

            <div className="mb-6">
              <div className="mb-2.5 flex items-center justify-between"><label className="text-xs font-semibold">01 <span className="ml-1.5 text-[#333832]">Vehicle photo</span></label>{sourceDataUrl && <button onClick={() => fileInputRef.current?.click()} className="text-[11px] font-medium text-[#718675] hover:text-[#34493b]">Replace</button>}</div>
              <input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} aria-label="Choose a car photo" />
              {sourceDataUrl ? <div className="group relative overflow-hidden rounded-2xl border border-black/10 bg-[#e8e8e2]">
                <img src={sourceDataUrl} alt="Uploaded car photo" className="h-[148px] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-8 text-white"><span className="max-w-[210px] truncate text-[11px] font-medium">{fileName}</span><button onClick={() => { setSourceDataUrl(null); setFileName(""); setPreviewUrl(null); setPreviewMeta(null); }} className="rounded-full bg-white/20 p-1.5 hover:bg-white/35" aria-label="Remove selected photo"><X size={13} /></button></div>
              </div> : <button onClick={() => fileInputRef.current?.click()} onDragEnter={event => { event.preventDefault(); setIsDragging(true); }} onDragOver={event => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={onDrop} className={`flex min-h-[132px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-3 py-5 text-center transition ${isDragging ? "border-[#78917c] bg-[#eff4ee]" : "border-[#d8d9d1] bg-[#f8f8f5] hover:border-[#9fac9f] hover:bg-[#f4f5f0]"}`}>
                <span className="mb-2.5 grid h-9 w-9 place-items-center rounded-xl bg-white text-[#718575] shadow-sm"><ImagePlus size={17} /></span><span className="text-xs font-semibold">Drop a photo or browse</span><span className="mt-1.5 text-[10px] text-[#92948e]">JPG, PNG, or WebP · up to 12 MB</span>
              </button>}
              <p className="mt-2 text-[10px] leading-4 text-[#95968f]">A clear side or three-quarter view works best. Photo is resized in your browser before upload.</p>
            </div>

            <div className="mb-6 border-t border-black/[.07] pt-5">
              <div className="mb-3 flex items-center justify-between"><label className="text-xs font-semibold">02 <span className="ml-1.5">Choose a color</span></label><span className="text-[10px] font-medium text-[#888b83]">{selectedColor.name}</span></div>
              <div className="grid grid-cols-4 gap-x-3 gap-y-3">
                {wrapColors.map(color => <button key={color.id} onClick={() => setSelectedColorId(color.id)} aria-label={`Select ${color.name}`} aria-pressed={selectedColorId === color.id} className="group flex flex-col items-center gap-1.5">
                  <span className={`grid h-10 w-10 place-items-center rounded-full border border-black/10 ${color.className} ${selectedColorId === color.id ? "ring-2 ring-[#455c4b] ring-offset-2 ring-offset-white" : "transition group-hover:scale-105"}`}>{selectedColorId === color.id && <Check size={15} className={color.id === "porcelain" ? "text-[#3b433d]" : "text-white"} />}</span><span className="text-[9px] font-medium text-[#777a73]">{color.name}</span>
                </button>)}
              </div>
            </div>

            <div className="mb-6 border-t border-black/[.07] pt-5">
              <div className="mb-3 flex items-center justify-between"><label className="text-xs font-semibold">03 <span className="ml-1.5">Surface finish</span></label><span className="text-[10px] text-[#93958e]">Choose one</span></div>
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#f1f2ee] p-1">
                {finishes.map(finish => <button key={finish.id} onClick={() => setSelectedFinish(finish.id)} aria-pressed={selectedFinish === finish.id} className={`rounded-lg px-1 py-2 text-[10px] font-medium transition ${selectedFinish === finish.id ? "bg-white text-[#334639] shadow-sm" : "text-[#85877f] hover:text-[#424840]"}`}>{finish.name}</button>)}
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="direction" className="mb-2 block text-xs font-semibold">A little more direction <span className="font-normal text-[#a0a198]">· optional</span></label>
              <textarea id="direction" value={additionalNotes} onChange={event => setAdditionalNotes(event.target.value.slice(0, 220))} rows={2} maxLength={220} placeholder="e.g. Keep the roof black; subtle bronze accents" className="w-full resize-none rounded-xl border border-black/[.09] bg-[#fbfbf9] px-3 py-2.5 text-xs leading-5 outline-none transition placeholder:text-[#a4a69f] focus:border-[#8ca18f] focus:ring-2 focus:ring-[#8ca18f]/15" />
              <div className="mt-1 text-right text-[9px] text-[#a3a49d]">{additionalNotes.length}/220</div>
            </div>

            {errorMessage && <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-[#ebd8d0] bg-[#fbf2ee] p-3 text-[11px] leading-4 text-[#925b4d]"><Info size={14} className="mt-0.5 shrink-0" /><span>{errorMessage}</span></div>}
            {savedMessage && <div role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-[#edf3ec] p-3 text-[11px] font-medium text-[#4c6b53]"><Check size={14} />{savedMessage}</div>}
            <button onClick={() => void createPreview()} disabled={isGenerating || authLoading || !sourceDataUrl} className="flex h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#27372e] px-4 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(39,55,46,.15)] transition hover:bg-[#3b4d41] active:scale-[.985] disabled:cursor-not-allowed disabled:bg-[#b8bdb7] disabled:shadow-none">
              {isGenerating ? <><LoaderCircle size={15} className="animate-spin" /> Creating your preview…</> : <><Sparkles size={15} /> Generate AI concept <ArrowUpRight size={14} /></>}
            </button>
            {!isAuthenticated && !authLoading && <button onClick={() => startLogin()} className="mt-3 flex w-full items-center justify-center gap-1.5 text-[10px] font-medium text-[#758477] hover:text-[#34493b]"><LockKeyhole size={12} /> Sign in first to keep the flow uninterrupted</button>}
            <p className="mt-3 text-center text-[10px] leading-4 text-[#999b94]">AI imagery can change details beyond the requested wrap. It is a styling concept, not an exact installation preview.</p>
          </aside>

          <section className="order-1 min-w-0 xl:order-2" aria-label="Vehicle preview workspace">
            <div className="overflow-hidden rounded-[26px] border border-black/[.08] bg-[#1c2220] shadow-[0_18px_60px_rgba(30,37,31,.11)]">
              <div className="flex flex-col gap-3 border-b border-white/[.08] px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.07] text-[#c3d1c4]"><ArrowLeftRight size={17} /></span><div><div className="text-[10px] font-semibold tracking-[.16em] text-[#abb5ac]">PREVIEW BAY</div><div className="mt-1 flex items-center gap-2 text-xs"><span className="text-white/90">Before</span><span className="h-px w-5 bg-white/30" /><span className="text-white/55">After</span></div></div></div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {previewUrl && <><button onClick={() => void handleSaveBuild()} className="h-9 rounded-full border border-white/15 px-3 text-[10px] font-medium text-white/80 transition hover:bg-white/10">Save build</button><a href={previewUrl} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-1.5 rounded-full bg-[#d9e4d8] px-3 text-[10px] font-semibold text-[#27372e] transition hover:bg-white"><ArrowDownToLine size={13} /> Open image</a></>}
                </div>
              </div>

              <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_52%_41%,rgba(104,125,112,.23),transparent_52%),linear-gradient(140deg,#252c29,#171c1b)] px-4 py-9 sm:min-h-[430px] sm:px-8 lg:min-h-[510px]">
                <div className="pointer-events-none absolute inset-0 opacity-[.08]" style={{ backgroundImage: "radial-gradient(#cad5cc 0.7px, transparent 0.7px)", backgroundSize: "21px 21px" }} />
                {sourceDataUrl ? <div className="relative w-full max-w-[1000px] overflow-hidden rounded-xl shadow-[0_30px_80px_rgba(0,0,0,.34)]">
                  <img src={previewUrl ?? sourceDataUrl} alt={previewUrl ? "AI-generated wrap concept preview" : "Uploaded car photo"} className="block max-h-[58vh] min-h-[250px] w-full bg-[#151a18] object-contain" />
                  {previewUrl && <>
                    <img src={sourceDataUrl} alt="Original car photo, shown to the left of the comparison handle" className="absolute inset-0 h-full w-full object-contain" style={{ clipPath: `inset(0 ${100 - comparison}% 0 0)` }} />
                    <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/90 shadow-[0_0_12px_rgba(0,0,0,.45)]" style={{ left: `${comparison}%` }}><span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-[#26352d] text-white shadow-lg"><ArrowLeftRight size={16} /></span></div>
                    <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-semibold tracking-[.1em] text-white backdrop-blur">ORIGINAL</span><span className="absolute right-3 top-3 rounded-full bg-[#dce8dc]/90 px-2.5 py-1 text-[9px] font-semibold tracking-[.1em] text-[#26352d] backdrop-blur">CONCEPT</span>
                  </>}
                </div> : <div className="relative z-10 flex w-full max-w-[740px] flex-col items-center px-3 text-center">
                  <div className="mb-3 flex w-full items-center justify-between text-[9px] font-medium tracking-[.17em] text-white/35"><span>STUDIO REFERENCE</span><span>YOUR VEHICLE GOES HERE</span></div>
                  <EmptyCarIllustration />
                  <div className="mt-4 max-w-[380px]"><p className="text-[17px] font-medium tracking-[-.025em] text-[#eef0eb]">Your next look starts with a photo.</p><p className="mt-2 text-xs leading-5 text-[#a4aca5]">Upload your car in the panel and explore a new color and surface finish.</p><button onClick={() => fileInputRef.current?.click()} className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#d6e2d6] px-4 text-[11px] font-semibold text-[#27372e] transition hover:bg-white"><Upload size={14} /> Upload a car photo</button></div>
                </div>}
                {isGenerating && <div className="absolute inset-0 z-20 grid place-items-center bg-[#101513]/70 p-6 backdrop-blur-sm"><div className="max-w-[310px] text-center text-white"><span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/[.08]"><LoaderCircle size={22} className="animate-spin text-[#d7e6d7]" /></span><p className="text-sm font-semibold">Shaping the concept</p><p className="mt-2 text-xs leading-5 text-white/65">The image model is applying your wrap direction. This usually takes a little while.</p></div></div>}
              </div>

              <div className="flex flex-col gap-4 border-t border-white/[.08] bg-[#202725] px-4 py-4 sm:flex-row sm:items-center sm:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[.06] text-[#c2d0c3]"><Palette size={14} /></span><div className="min-w-0"><p className="truncate text-[11px] font-medium text-white/90">{previewMeta ? `${previewMeta.colorName} · ${previewMeta.finish}` : `${selectedColor.name} · ${selectedFinish}`}</p><p className="mt-1 text-[9px] text-white/40">{previewMeta ? "Last generated configuration" : "Selected wrap configuration"}</p></div></div>
                {previewUrl && <div className="flex flex-1 items-center gap-3 sm:max-w-[330px]"><span className="shrink-0 text-[9px] font-semibold tracking-[.1em] text-white/45">COMPARE</span><input aria-label="Slide to compare original and concept" type="range" min="0" max="100" value={comparison} onChange={event => setComparison(Number(event.target.value))} className="h-1.5 w-full cursor-ew-resize accent-[#d5e1d5]" /><span className="hidden text-[9px] text-white/40 sm:inline">DRAG</span></div>}
                <div className="flex items-center gap-1.5 text-[9px] text-white/40"><Clock3 size={12} />{previewUrl ? "Concept preview" : "Ready when you are"}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-col justify-between gap-2 px-1 text-[10px] leading-4 text-[#92948e] sm:flex-row sm:items-center"><span className="flex items-start gap-2"><Info size={13} className="mt-[1px] shrink-0 text-[#879489]" />Concepts are for inspiration only. Real materials, lighting, fitment, and installation may look different.</span><a href="#privacy" className="flex items-center gap-1 self-end whitespace-nowrap font-medium text-[#79877b] hover:text-[#475b4b] sm:self-auto">Image use <ArrowUpRight size={11} /></a></div>
          </section>
        </div>

        <section id="privacy" className="mt-7 flex flex-col gap-3 rounded-2xl border border-[#dfe1d9] bg-white/45 p-4 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8eee6] text-[#728676]"><LockKeyhole size={14} /></span><div><h2 className="text-xs font-semibold">Photo and preview handling</h2><p className="mt-1 max-w-[960px] text-[10px] leading-[1.7] text-[#85877f]">Your selected photo is resized in this browser and sent to the AI image service only when you generate a concept. Saved build details and the source photo are kept in this browser's local storage. The generated preview is stored by the project's image service so it can be displayed. Removing a saved build deletes its local record, not the stored generated image. Avoid uploading photos you don't have permission to use or that contain sensitive information.</p></div>
        </section>
        <footer className="flex flex-col gap-2 px-1 pb-2 pt-7 text-[9px] text-[#a0a199] sm:flex-row sm:items-center sm:justify-between"><span>VANTA AUTO STUDIO <span className="mx-1">·</span> CONCEPT BUILDER</span><span>Made for exploring ideas, not certifying a build.</span></footer>
      </main>
    </div>
  );
}
