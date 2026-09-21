import React from "react";
import { AlertTriangle, CheckCircle2, Quote } from "lucide-react";

interface LessonContentProps {
  content: string;
  locale: string;
}

export default function LessonContent({ content }: LessonContentProps) {
  // Découpage du contenu en paragraphes / blocs simples
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inBlockquote = false;
  let blockquoteLines: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushBlockquote = (key: string) => {
    if (blockquoteLines.length > 0) {
      const text = blockquoteLines.join(" ");
      elements.push(
        <div
          key={key}
          className="my-4 rounded-xl border-l-4 rtl:border-l-0 rtl:border-r-4 border-sable-400 bg-sable-100/40 p-4 relative text-sable-800 italic leading-relaxed"
        >
          <Quote className="w-4 h-4 text-sable-400 mb-1 opacity-60" />
          <p>{text}</p>
        </div>
      );
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="my-4 space-y-2 list-disc list-inside text-sable-700 leading-relaxed pl-2 rtl:pl-0 rtl:pr-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm sm:text-base">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (text: string): React.ReactNode => {
    // Remplacement simple du gras **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-bleuNuit-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushBlockquote(`bq-${i}`);
      flushList(`list-${i}`);
      continue;
    }

    // Traitement des listes
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushBlockquote(`bq-${i}`);
      inList = true;
      listItems.push(line.slice(2));
      continue;
    } else if (inList) {
      flushList(`list-${i}`);
    }

    // Traitement des blockquotes
    if (line.startsWith("> ")) {
      inBlockquote = true;
      blockquoteLines.push(line.slice(2));
      continue;
    } else if (inBlockquote) {
      flushBlockquote(`bq-${i}`);
    }

    // Traitement des titres H1
    if (line.startsWith("# ")) {
      elements.push(
        <h2
          key={`h1-${i}`}
          className="text-2xl font-bold text-bleuNuit-900 border-b border-sable-200 pb-2 mt-8 mb-4 first:mt-2"
        >
          {line.slice(2)}
        </h2>
      );
      continue;
    }

    // Traitement des titres H2
    if (line.startsWith("## ")) {
      elements.push(
        <h3
          key={`h2-${i}`}
          className="text-xl font-bold text-bleuNuit-800 mt-6 mb-3"
        >
          {line.slice(3)}
        </h3>
      );
      continue;
    }

    // Traitement des titres H3 avec callouts spéciaux
    if (line.startsWith("### ")) {
      const title = line.slice(4);

      if (title.includes("Le piège")) {
        elements.push(
          <div
            key={`trap-${i}`}
            className="flex items-center gap-2 text-base font-bold text-red-800 bg-red-50/80 px-4 py-2 rounded-lg border border-red-200 mt-6 mb-2"
          >
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>{title}</span>
          </div>
        );
      } else if (title.includes("La règle de vérification")) {
        elements.push(
          <div
            key={`rule-${i}`}
            className="flex items-center gap-2 text-base font-bold text-emerald-800 bg-emerald-50/80 px-4 py-2 rounded-lg border border-emerald-200 mt-6 mb-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{title}</span>
          </div>
        );
      } else {
        elements.push(
          <h4
            key={`h3-${i}`}
            className="text-lg font-bold text-bleuNuit-800 mt-4 mb-2"
          >
            {title}
          </h4>
        );
      }
      continue;
    }

    // Séparateur horizontal
    if (line === "---") {
      elements.push(
        <hr key={`hr-${i}`} className="my-8 border-sable-200" />
      );
      continue;
    }

    // Paragraphe classique
    elements.push(
      <p
        key={`p-${i}`}
        className="text-base text-sable-800 leading-relaxed my-3 font-normal"
      >
        {renderInline(line)}
      </p>
    );
  }

  flushBlockquote("bq-end");
  flushList("list-end");

  return <div className="space-y-2 lesson-prose">{elements}</div>;
}
