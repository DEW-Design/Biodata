"use client";

// Optional organisation/institution logo on Step 1's "Who owns this data?" card, per direct
// request. Page-local, same as the auth flow's own profile-picture upload
// (app/pages/auth/setup-profile) - no DEW file-upload component exists yet. Click or drag a file
// onto the drop zone; the requirements are checked on pick (type, size, and - for raster images -
// minimum dimensions), so a bad file is rejected with a specific reason rather than silently
// accepted. No backend exists anywhere in this build, so the file only ever lives as a local
// object URL for the preview.

import { useRef, useState, type DragEvent } from "react";
import { Image01, Trash01, UploadCloud02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import type { OrgLogo } from "./types";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;
const MIN_PX = 200;

export const LOGO_REQUIREMENTS = [
    "PNG, JPG, SVG or WebP",
    "Max file size 2 MB",
    `Square, at least ${MIN_PX} × ${MIN_PX} px`,
    "Transparent or white background works best",
];

function formatSize(bytes: number) {
    return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = reject;
        img.src = url;
    });
}

export function LogoUpload({ value, onChange, orgName }: { value: OrgLogo | null; onChange: (logo: OrgLogo | null) => void; orgName: string }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        setError(null);
        if (!ACCEPTED_TYPES.includes(file.type)) return setError("That file type isn't supported - use PNG, JPG, SVG or WebP.");
        if (file.size > MAX_BYTES) return setError(`That file is ${formatSize(file.size)} - the limit is 2 MB.`);

        const previewUrl = URL.createObjectURL(file);
        // SVGs scale to any size, so only raster images need the minimum-dimension check.
        if (file.type !== "image/svg+xml") {
            try {
                const { width, height } = await readDimensions(previewUrl);
                if (width < MIN_PX || height < MIN_PX) {
                    URL.revokeObjectURL(previewUrl);
                    return setError(`That image is ${width} × ${height} px - it needs to be at least ${MIN_PX} × ${MIN_PX} px.`);
                }
            } catch {
                URL.revokeObjectURL(previewUrl);
                return setError("That image couldn't be read - try another file.");
            }
        }
        if (value) URL.revokeObjectURL(value.previewUrl);
        onChange({ fileName: file.name, sizeBytes: file.size, previewUrl });
    };

    const remove = () => {
        if (value) URL.revokeObjectURL(value.previewUrl);
        onChange(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
    };

    return (
        <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-secondary">
                Organisation / Institution logo <span className="font-normal text-tertiary">(optional)</span>
            </p>

            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {value ? (
                <div className="flex items-center gap-4 rounded-xl border border-secondary bg-primary p-4">
                    <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-secondary bg-primary">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={value.previewUrl} alt={`${orgName || "Organisation"} logo`} className="size-full object-contain" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <p className="truncate text-sm font-medium text-secondary">{value.fileName}</p>
                        <p className="text-sm text-tertiary">{formatSize(value.sizeBytes)}</p>
                    </div>
                    <Button color="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                        Replace
                    </Button>
                    <Button color="secondary" size="sm" iconLeading={Trash01} aria-label="Remove logo" onClick={remove} />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={cx(
                        "flex w-full flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                        isDragging ? "border-[var(--color-brand-500)] bg-brand-50" : error ? "border-[var(--color-error-300)] bg-primary" : "border-primary bg-primary hover:bg-secondary",
                    )}
                >
                    <span className="flex size-10 items-center justify-center rounded-lg border border-secondary bg-primary shadow-xs">
                        <UploadCloud02 className="size-5 text-fg-quaternary" />
                    </span>
                    <span className="text-sm text-tertiary">
                        <span className="font-semibold text-brand-secondary">Click to upload</span> or drag and drop
                    </span>
                </button>
            )}

            {error ? (
                <p className="text-sm text-error-primary">{error}</p>
            ) : (
                <p className="flex items-start gap-2 text-sm text-tertiary">
                    <Image01 aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
                    <span>{LOGO_REQUIREMENTS.join(" · ")}</span>
                </p>
            )}
        </div>
    );
}
