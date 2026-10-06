"use client";

import { ChevronDown, Download01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";

// A template's downloads, one treatment wherever a template is offered (the Template Finder, the upload
// form's recommended templates): a single Download button that opens the formats, instead of a pair of
// buttons repeated on every row. There are no template files in the preview, so both formats are listed
// but disabled, each saying "Coming soon". The wireframe draws Excel and PDF file glyphs; there is no
// file-type icon in the library, so the formats are named.
export function TemplateDownloads() {
  return (
    <Dropdown.Root>
      <Button color="secondary" size="sm" iconLeading={Download01} iconTrailing={ChevronDown}>
        Download
      </Button>
      <Dropdown.Popover placement="bottom start" className="w-56">
        <Dropdown.Menu aria-label="Download this template">
          <Dropdown.Item id="excel" label="Excel" addon="Coming soon" isDisabled />
          <Dropdown.Item id="pdf" label="PDF" addon="Coming soon" isDisabled />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
