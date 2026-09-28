"use client";

import { Download01 } from "@untitledui/icons";
import { Focusable } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Tooltip } from "@/components/base/tooltip/tooltip";

// A template's Excel and PDF downloads, one treatment wherever a template is offered (the Template
// Finder, the upload form's recommended templates). There are no template files in the preview, so
// both are disabled with a "Coming soon" tooltip. The wireframe draws Excel and PDF file glyphs;
// there is no file-type icon in the library, so the formats are named on the buttons instead.
export function TemplateDownloads() {
  return (
    <div className="flex items-center gap-2">
      {["Excel", "PDF"].map((format) => (
        <Tooltip key={format} title="Coming soon" description="Template downloads aren't available in this preview.">
          <Focusable>
            <span className="inline-flex">
              <Button color="secondary" size="sm" iconLeading={Download01} isDisabled>
                {format}
              </Button>
            </span>
          </Focusable>
        </Tooltip>
      ))}
    </div>
  );
}
