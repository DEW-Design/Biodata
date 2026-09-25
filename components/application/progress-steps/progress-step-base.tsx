"use client";

import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import type { ComponentType, StepBaseProps } from "./progress-types";

export const statuses = {
    incomplete: {
        icon: "bg-primary ring-[1.5px] ring-inset ring-primary",
        dot: "bg-fg-quaternary",
        connector: "border-secondary",
        title: "text-secondary",
        description: "text-tertiary",
    },
    current: {
        icon: "bg-brand-solid ring-2 ring-focus-ring ring-offset-[var(--ui-bg-primary)] ring-offset-2",
        dot: "bg-fg-white",
        connector: "border-secondary",
        title: "text-brand-secondary",
        description: "text-brand-tertiary",
    },
    complete: {
        icon: "bg-brand-solid text-fg-white",
        dot: "hidden",
        connector: "border-brand",
        title: "text-secondary",
        description: "text-tertiary",
    },
};

// A step is a real button only when it was given `onClick` (a completed step you can go back to).
const interactive = (onClick?: () => void) =>
    onClick
        ? {
              role: "button" as const,
              tabIndex: 0,
              onClick,
              onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onClick();
                  }
              },
          }
        : {};
const clickable = (onClick?: () => void) => onClick && "cursor-pointer rounded-lg outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4";

export const IconOnly = <T extends ComponentType>({ status = "incomplete", size = "sm", error = false }: Pick<StepBaseProps<T>, "size" | "status" | "error">) => {
    return (
        <span className={cx("z-10 flex items-center justify-center rounded-full", statuses[status].icon, error && "bg-primary ring-[1.5px] ring-error ring-inset", size === "sm" ? "size-6" : "size-8")}>
            <span className={cx("rounded-full", error ? "bg-error-solid" : statuses[status].dot, size === "sm" ? "size-2" : "size-2.5")} />

            {/* Tick icon. */}
            {status === "complete" && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={cx(size === "sm" ? "size-3" : "size-4")}>
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </span>
    );
};

export const IconTop = <T extends ComponentType>({
    status = "incomplete",
    connector = true,
    size = "sm",
    title,
    description,
    onClick,
    error = false,
    ...otherProps
}: StepBaseProps<T>) => {
    return (
        <div {...interactive(onClick)} className={cx("flex w-full flex-col items-center justify-center gap-4", size === "sm" && "gap-3", clickable(onClick))}>
            <div className="relative flex w-full flex-col items-center self-stretch">
                <IconOnly {...otherProps} size={size} status={status} error={error} />
                {connector && (
                    <span className={cx("absolute top-1/2 left-[53%] z-0 w-full flex-1 -translate-y-1/2 rounded-xs border-t-2", statuses[status].connector)} />
                )}
            </div>
            <div className={cx("flex w-full flex-col items-start gap-0.5 self-stretch", size === "sm" && "gap-0")}>
                <p className={cx("w-full text-center text-balance", statuses[status].title, error && "text-error-primary", size === "sm" ? "text-sm font-semibold" : "text-base font-semibold")}>{title}</p>
                {description && <p className={cx("w-full text-center text-balance", statuses[status].description, error && "text-error-primary", size === "sm" ? "text-sm" : "text-base")}>{description}</p>}
            </div>
        </div>
    );
};

export const IconLeft = <T extends ComponentType>({
    status = "incomplete",
    connector = true,
    size = "sm",
    title,
    description,
    onClick,
    error = false,
    ...otherProps
}: StepBaseProps<T>) => {
    return (
        <div {...interactive(onClick)} className={cx("group flex h-max flex-row items-start justify-start gap-4", size === "sm" && "gap-3", clickable(onClick))}>
            <div className="flex flex-col items-center self-stretch">
                <IconOnly {...otherProps} size={size} status={status} error={error} />
                {connector && <span className={cx("flex-1 rounded-xs border-l-2", statuses[status].connector, size === "sm" ? "my-1" : "my-1.5")} />}
            </div>
            <div className={cx("flex flex-col items-start", size === "sm" ? "pt-0.5 not-group-last:pb-6" : "pt-1 not-group-last:pb-8")}>
                <p className={cx("text-balance", statuses[status].title, error && "text-error-primary", size === "sm" ? "text-sm font-semibold" : "text-base font-semibold")}>{title}</p>
                {description && <p className={cx("text-balance", statuses[status].description, error && "text-error-primary", size === "sm" ? "text-sm" : "text-base")}>{description}</p>}
            </div>
        </div>
    );
};

export const IconTopNumber = <T extends ComponentType>({
    status = "incomplete",
    connector = true,
    size = "sm",
    title,
    description,
    onClick,
    error = false,
    step,
}: StepBaseProps<T> & { step: number }) => {
    const statuses = {
        incomplete: {
            icon: "bg-primary ring-1 ring-inset ring-secondary text-quaternary",
            title: "text-secondary",
            description: "text-tertiary",
        },
        current: {
            icon: "bg-primary ring-1 ring-inset ring-secondary text-secondary",
            title: "text-secondary",
            description: "text-tertiary",
        },
        complete: {
            icon: "bg-success-solid text-fg-white",
            title: "text-secondary",
            description: "text-tertiary",
        },
    };

    return (
        <div {...interactive(onClick)} className={cx("flex w-full flex-col items-center justify-center gap-4", size === "sm" && "gap-3", clickable(onClick))}>
            <div className="relative flex w-full flex-col items-center self-stretch">
                <span
                    className={cx(
                        "z-10 flex items-center justify-center rounded-full",
                        statuses[status].icon,
                        status === "incomplete" && "opacity-60",
                        error && "bg-primary text-error-primary opacity-100 ring-error",
                        size === "sm" ? "size-6" : "size-8",
                    )}
                >
                    {status === "complete" ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={cx(size === "sm" ? "size-3" : "size-4")}>
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <span className={cx("font-semibold", size === "sm" ? "text-xs" : "text-sm")}>{step}</span>
                    )}
                </span>

                {connector && (
                    <svg className="absolute top-1/2 left-[53%] z-0 h-[2.5px] w-full flex-1 -translate-y-1/2 max-md:hidden">
                        <line
                            x1="1.2"
                            y1="1.2"
                            x2="100%"
                            y2="1.2"
                            className="stroke-[var(--ui-border-primary)]"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeDasharray="0,6"
                            strokeLinecap="round"
                        />
                    </svg>
                )}
            </div>
            <div className={cx("flex w-full flex-col items-start gap-0.5 self-stretch", status === "incomplete" && !error && "opacity-60", size === "sm" && "gap-0")}>
                <p className={cx("w-full text-center text-balance", statuses[status].title, error && "text-error-primary", size === "sm" ? "text-sm font-semibold" : "text-base font-semibold")}>{title}</p>
                {description && <p className={cx("w-full text-center text-balance", statuses[status].description, error && "text-error-primary", size === "sm" ? "text-sm" : "text-base")}>{description}</p>}
            </div>
        </div>
    );
};

export const IconLeftNumber = <T extends ComponentType>({
    status = "incomplete",
    connector = true,
    size = "sm",
    title,
    description,
    onClick,
    error = false,
    step,
}: StepBaseProps<T> & { step: number }) => {
    const statuses = {
        incomplete: {
            icon: "bg-primary ring-1 ring-inset ring-secondary text-quaternary",
            title: "text-secondary",
            description: "text-tertiary",
        },
        current: {
            icon: "bg-primary ring-1 ring-inset ring-secondary text-secondary",
            title: "text-secondary",
            description: "text-tertiary",
        },
        complete: {
            icon: "bg-success-solid text-fg-white",
            title: "text-secondary",
            description: "text-tertiary",
        },
    };

    return (
        <div {...interactive(onClick)} className={cx("group flex h-max flex-row items-start justify-start gap-4", status === "incomplete" && !error && "opacity-60", size === "sm" && "gap-3", clickable(onClick))}>
            <div className="flex flex-col items-center self-stretch">
                <span
                    className={cx(
                        "z-10 flex shrink-0 items-center justify-center rounded-full",
                        statuses[status].icon,
                        status === "incomplete" && "opacity-60",
                        error && "bg-primary text-error-primary opacity-100 ring-error",
                        size === "sm" ? "size-6" : "size-8",
                    )}
                >
                    {status === "complete" ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={cx(size === "sm" ? "size-3" : "size-4")}>
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <span className={cx("font-semibold", size === "sm" ? "text-xs" : "text-sm")}>{step}</span>
                    )}
                </span>

                {connector && (
                    <div
                        className={cx(
                            "relative flex h-full w-full justify-center self-center overflow-hidden",
                            status === "current" && "opacity-60",
                            size === "sm" ? "my-1" : "my-1.5",
                        )}
                    >
                        <svg className="absolute" width="3">
                            <line
                                x1="1.2"
                                y1="1.2"
                                x2="1.2"
                                y2="100%"
                                className="stroke-[var(--ui-border-primary)]"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeDasharray="0,6"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                )}
            </div>
            <div className={cx("flex flex-col items-start", size === "sm" ? "pt-0.5 not-group-last:pb-6" : "pt-1 not-group-last:pb-8")}>
                <p className={cx("text-balance", statuses[status].title, error && "text-error-primary", size === "sm" ? "text-sm font-semibold" : "text-base font-semibold")}>{title}</p>
                {description && <p className={cx("text-balance", statuses[status].description, error && "text-error-primary", size === "sm" ? "text-sm" : "text-base")}>{description}</p>}
            </div>
        </div>
    );
};

export const FeaturedIconTop = <T extends ComponentType>({
    status = "incomplete",
    connector = true,
    size = "sm",
    icon: Icon,
    title,
    description,
    onClick,
}: StepBaseProps<T>) => {
    return (
        <div {...interactive(onClick)} className={cx("flex w-full flex-col items-center justify-center gap-4", size === "sm" && "gap-3", clickable(onClick))}>
            <div className={cx("relative flex w-full flex-col items-center self-stretch")}>
                <FeaturedIcon
                    icon={Icon}
                    color="gray"
                    theme="modern"
                    size={size === "sm" ? "md" : "lg"}
                    className={cx("z-10", status === "incomplete" && "text-fg-quaternary")}
                />

                {connector && (
                    <span
                        className={cx(
                            "absolute top-1/2 left-[53%] z-0 w-full flex-1 -translate-y-1/2 rounded-xs border-t-2 border-secondary",
                            status === "complete" && "border-fg-secondary",
                        )}
                    />
                )}
            </div>
            <div className={cx("flex w-full flex-col items-start gap-0.5 self-stretch", status === "incomplete" && "opacity-60", size === "sm" && "gap-0")}>
                <p className={cx("w-full text-center text-secondary", size === "sm" ? "text-sm font-semibold" : "text-base font-semibold")}>{title}</p>
                {description && <p className={cx("w-full text-center text-tertiary", size === "sm" ? "text-sm" : "text-base")}>{description}</p>}
            </div>
        </div>
    );
};

export const FeaturedIconLeft = <T extends ComponentType>({
    status = "incomplete",
    connector = true,
    size = "sm",
    icon: Icon,
    title,
    description,
    onClick,
}: StepBaseProps<T>) => {
    return (
        <div {...interactive(onClick)} className={cx("group flex flex-row gap-4", status !== "current" && "opacity-60", size === "sm" && "gap-3", clickable(onClick))}>
            <div className="flex flex-col items-center self-stretch">
                <FeaturedIcon size={size === "sm" ? "md" : "lg"} color="gray" theme="modern">
                    {Icon && <Icon />}
                </FeaturedIcon>

                {connector && <span className={cx(status === "current" && "opacity-60", "my-1 flex-1 rounded-xs border-l-2 border-secondary")} />}
            </div>
            <div className="flex flex-col items-start not-group-last:pb-8">
                <p className={cx("text-balance text-secondary", size === "sm" ? "text-sm font-semibold" : "text-base font-semibold")}>{title}</p>
                {description && <p className={cx("text-balance text-tertiary", size === "sm" ? "text-sm" : "text-base")}>{description}</p>}
            </div>
        </div>
    );
};

export const TextLine = <T extends ComponentType>({ status = "incomplete", size = "sm", title, description }: StepBaseProps<T>) => {
    return (
        <div className={cx("relative flex w-full flex-col items-center justify-center pt-2", size === "sm" && "pt-3", size === "md" && "pt-4")}>
            <div className={cx("absolute inset-x-0 top-0 h-1 bg-fg-brand-primary", status === "incomplete" && "bg-tertiary")} />

            <div className={cx("flex w-full flex-col items-start gap-0.5 self-stretch", size === "sm" && "gap-0")}>
                <p
                    className={cx(
                        "text-balance text-secondary",
                        status === "current" && "text-brand-secondary",
                        size === "sm" ? "text-sm font-semibold" : "text-base font-semibold",
                    )}
                >
                    {title}
                </p>
                {description && <p className={cx("text-balance text-tertiary", status === "current" && "text-brand-tertiary", size === "sm" ? "text-sm" : "text-base")}>{description}</p>}
            </div>
        </div>
    );
};
