'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Caveat } from 'next/font/google';

import { Settings2, Trash } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';

import { PDF_VIEWER_PAGE_SELECTOR } from '@documenso/lib/constants/pdf-viewer';

import { cn } from '../../lib/utils';
import { Card, CardContent } from '../card';
import type { CombinedStylesKey } from './add-fields';
import { FieldIcon } from './field-icon';
import type { TDocumentFlowFormSchema } from './types';

/* 
  I hate this, but due to TailwindCSS JIT, I couldnn't find a better way to do this for now.

  TODO: Try to find a better way to do this.
*/
export const combinedStyles = {
  'orange-500': {
    ringColor: 'ring-orange-500/30 ring-offset-orange-500',
    borderWithHover: 'group-data-[selected]:border-orange-500 hover:border-orange-500',
    border: 'border-orange-500',
    borderActive: 'border-orange-500 bg-orange-500/20',
    background: 'bg-orange-500/60 border-orange-500',
    initialsBG: 'bg-orange-500',
    fieldBackground: 'bg-orange-500/[.025]',
  },
  'green-500': {
    ringColor: 'ring-green-500/30 ring-offset-green-500',
    borderWithHover: 'group-data-[selected]:border-green-500 hover:border-green-500',
    border: 'border-green-500',
    borderActive: 'border-green-500 bg-green-500/20',
    background: 'bg-green-500/60 border-green-500',
    initialsBG: 'bg-green-500',
    fieldBackground: 'bg-green-500/[.025]',
  },
  'cyan-500': {
    ringColor: 'ring-cyan-500/30 ring-offset-cyan-500',
    borderWithHover: 'group-data-[selected]:border-cyan-500 hover:border-cyan-500',
    border: 'border-cyan-500',
    borderActive: 'border-cyan-500 bg-cyan-500/20',
    background: 'bg-cyan-500/60 border-cyan-500',
    initialsBG: 'bg-cyan-500',
    fieldBackground: 'bg-cyan-500/[.025]',
  },
  'blue-500': {
    ringColor: 'ring-blue-500/30 ring-offset-blue-500',
    borderWithHover: 'group-data-[selected]:border-blue-500 hover:border-blue-500',
    border: 'border-blue-500',
    borderActive: 'border-blue-500 bg-blue-500/20',
    background: 'bg-blue-500/60 border-blue-500',
    initialsBG: 'bg-blue-500',
    fieldBackground: 'bg-blue-500/[.025]',
  },
  'indigo-500': {
    ringColor: 'ring-indigo-500/30 ring-offset-indigo-500',
    borderWithHover: 'group-data-[selected]:border-indigo-500 hover:border-indigo-500',
    border: 'border-indigo-500',
    borderActive: 'border-indigo-500 bg-indigo-500/20',
    background: 'bg-indigo-500/60 border-indigo-500',
    initialsBG: 'bg-indigo-500',
    fieldBackground: 'bg-indigo-500/[.025]',
  },
  'purple-500': {
    ringColor: 'ring-purple-500/30 ring-offset-purple-500',
    borderWithHover: 'group-data-[selected]:border-purple-500 hover:border-purple-500',
    border: 'border-purple-500',
    borderActive: 'border-purple-500 bg-purple-500/20',
    background: 'bg-purple-500/60 border-purple-500',
    initialsBG: 'bg-purple-500',
    fieldBackground: 'bg-purple-500/[.025]',
  },
  'pink-500': {
    ringColor: 'ring-pink-500/30 ring-offset-pink-500',
    borderWithHover: 'group-data-[selected]:border-pink-500 hover:border-pink-500',
    border: 'border-pink-500',
    borderActive: 'border-pink-500 bg-pink-500/20',
    background: 'bg-pink-500/60 border-pink-500',
    initialsBG: 'bg-pink-500',
    fieldBackground: 'bg-ping-500/[.025]',
  },
  'gray-500': {
    ringColor: 'ring-gray-500/30 ring-offset-gray-500',
    borderWithHover: 'group-data-[selected]:border-gray-500 hover:border-gray-500',
    border: 'border-gray-500',
    borderActive: 'border-gray-500 bg-gray-500/20',
    background: 'bg-gray-500/60 border-gray-500',
    initialsBG: 'bg-gray-500',
    fieldBackground: 'bg-gray-500/[.025]',
  },
};

export const colorClasses: CombinedStylesKey[] = [
  'orange-500',
  'green-500',
  'cyan-500',
  'blue-500',
  'indigo-500',
  'purple-500',
  'pink-500',
];

type Field = TDocumentFlowFormSchema['fields'][0];

const fontCaveat = Caveat({
  weight: ['500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caveat',
});

export type FieldItemProps = {
  field: Field;
  passive?: boolean;
  disabled?: boolean;
  minHeight?: number;
  minWidth?: number;
  onResize?: (_node: HTMLElement) => void;
  onMove?: (_node: HTMLElement) => void;
  onRemove?: () => void;
  onAdvancedSettings?: () => void;
  color?: CombinedStylesKey;
  hideRecipients?: boolean;
};

export const FieldItem = ({
  field,
  passive,
  disabled,
  minHeight: _minHeight,
  minWidth: _minWidth,
  onResize,
  onMove,
  onRemove,
  onAdvancedSettings,
  color,
  hideRecipients = false,
}: FieldItemProps) => {
  const [active, setActive] = useState(false);
  const [coords, setCoords] = useState({
    pageX: 0,
    pageY: 0,
    pageHeight: 0,
    pageWidth: 0,
  });
  const [settingsActive, setSettingsActive] = useState(false);
  const cardRef = useRef(null);

  const selectedSignerStyles = useMemo(() => {
    if (!color) {
      return null;
    }

    const selectedColorVariant = combinedStyles[color];

    return {
      activeBorderClass: selectedColorVariant?.borderActive,
      borderClass: selectedColorVariant?.border,
      initialsBGClass: selectedColorVariant?.initialsBG,
      fieldBackground: selectedColorVariant?.fieldBackground,
    };
  }, [color]);

  const {
    borderClass: selectedSignerBorderClass,
    activeBorderClass: selectedSignerActiveBorderClass,
    initialsBGClass: selectedSignerInitialsBGClass,
    fieldBackground: selectedSignerFieldBackground,
  } = selectedSignerStyles || {
    borderClass: 'border-field-card-border',
    activeBorderClass: 'border-field-card-border/80',
    initialsBGClass: 'text-field-card-foreground/50 bg-slate-900/10',
    fieldBackground: 'bg-field-card-background',
  };

  const advancedField = ['NUMBER', 'RADIO', 'CHECKBOX', 'DROPDOWN', 'TEXT'].includes(field.type);

  const calculateCoords = useCallback(() => {
    const $page = document.querySelector<HTMLElement>(
      `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`,
    );

    if (!$page) {
      return;
    }

    const { height, width } = $page.getBoundingClientRect();

    const top = $page.getBoundingClientRect().top + window.scrollY;
    const left = $page.getBoundingClientRect().left + window.scrollX;

    // X and Y are percentages of the page's height and width
    const pageX = (field.pageX / 100) * width + left;
    const pageY = (field.pageY / 100) * height + top;

    const pageHeight = (field.pageHeight / 100) * height;
    const pageWidth = (field.pageWidth / 100) * width;

    setCoords({
      pageX: pageX,
      pageY: pageY,
      pageHeight: pageHeight,
      pageWidth: pageWidth,
    });
  }, [field.pageHeight, field.pageNumber, field.pageWidth, field.pageX, field.pageY]);

  useEffect(() => {
    calculateCoords();
  }, [calculateCoords]);

  useEffect(() => {
    const onResize = () => {
      calculateCoords();
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [calculateCoords]);

  const handleClickOutsideField = (event: MouseEvent) => {
    if (settingsActive && cardRef.current && !event.composedPath().includes(cardRef.current)) {
      setSettingsActive(false);
    }
  };

  useEffect(() => {
    document.body.addEventListener('click', handleClickOutsideField);
    return () => {
      document.body.removeEventListener('click', handleClickOutsideField);
    };
  }, [settingsActive]);

  return createPortal(
    <Rnd
      key={coords.pageX + coords.pageY + coords.pageHeight + coords.pageWidth}
      className={cn('group z-20', {
        'active:pointer-events-none': passive,
        'opacity-75 active:pointer-events-none': disabled,
        'z-10': !active || disabled,
      })}
      // minHeight={minHeight}
      // minWidth={minWidth}
      default={{
        x: coords.pageX,
        y: coords.pageY,
        height: coords.pageHeight,
        width: coords.pageWidth,
      }}
      bounds={`${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`}
      onDragStart={() => setActive(true)}
      onResizeStart={() => setActive(true)}
      onResizeStop={(_e, _d, ref) => {
        setActive(false);
        onResize?.(ref);
      }}
      onDragStop={(_e, d) => {
        setActive(false);
        onMove?.(d.node);
      }}
    >
      <Card
        className={cn('h-full w-full backdrop-blur-[1px]', selectedSignerFieldBackground, {
          [selectedSignerBorderClass]: !disabled,
          [selectedSignerActiveBorderClass]: active || settingsActive,
        })}
        onClick={() => {
          setSettingsActive((prev) => !prev);
        }}
        ref={cardRef}
      >
        <CardContent
          className={cn(
            'text-field-card-foreground flex h-full w-full flex-col items-center justify-center p-2',
            {
              'text-field-card-foreground/50': disabled,
            },
          )}
        >
          <FieldIcon
            type={field.type}
            signerEmail={field.signerEmail}
            fontCaveatClassName={fontCaveat.className}
          />

          {!hideRecipients && (
            <p
              className={cn(
                'absolute -right-9 z-20 hidden h-8 w-9 items-center justify-center rounded-r-xl font-semibold text-white group-hover:flex',
                selectedSignerInitialsBGClass,
                {
                  'text-field-card-foreground/50 bg-slate-900/10': disabled || passive,
                },
              )}
            >
              {(field.signerEmail?.charAt(0)?.toUpperCase() ?? '') +
                (field.signerEmail?.charAt(1)?.toUpperCase() ?? '')}
            </p>
          )}
        </CardContent>
      </Card>

      {!disabled && settingsActive && (
        <div className="mt-1 flex justify-center">
          <div
            className={cn(
              'dark:bg-background group flex items-center justify-evenly rounded-md border bg-gray-900',
              {
                'h-8 w-16': advancedField,
                'h-8 w-8': !advancedField,
              },
            )}
          >
            {advancedField && (
              <button
                className="dark:text-muted-foreground/50 dark:hover:text-muted-foreground dark:hover:bg-foreground/10 rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-100"
                onClick={onAdvancedSettings}
                onTouchEnd={onAdvancedSettings}
              >
                <Settings2 className="h-4 w-4" />
              </button>
            )}
            <button
              className="dark:text-muted-foreground/50 dark:hover:text-muted-foreground dark:hover:bg-foreground/10 rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-100"
              onClick={onRemove}
              onTouchEnd={onRemove}
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Rnd>,
    document.body,
  );
};
