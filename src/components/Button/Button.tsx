import React from 'react';

import type {DOMProps, QAProps} from '../types';
import {block} from '../utils/cn';
import {isIcon} from '../utils/common';
import {eventBroker} from '../utils/event-broker';
import {isOfType} from '../utils/isOfType';

import {ButtonIcon} from './ButtonIcon';

import './Button.scss';

export type ButtonView =
    | 'normal' // Grey background, no border
    | 'action' // Branded background, no border
    | 'outlined' // No background, grey border
    | 'outlined-info' // No background, with info-type border color
    | 'outlined-success' // No background, with success-type border color
    | 'outlined-warning' // No background, with warning-type border color
    | 'outlined-danger' // No background, with danger-type border color
    | 'outlined-utility' // No background, with utility-type border color
    | 'outlined-action' // No background, with branded border color
    | 'raised' // With white background and shadow
    | 'flat' // No background, no border
    | 'flat-secondary' // No background, no border, secondary-type text color
    | 'flat-info' // No background, no border, info-type text color
    | 'flat-success' // No background, no border, success-type text color
    | 'flat-warning' // No background, no border, warning-type text color
    | 'flat-danger' // No background, no border, danger-type text color
    | 'flat-utility' // No background, no border, utility-type text color
    | 'flat-action' // No background, no border, branded text color
    | 'normal-contrast' // normal button appearance with contrast background
    | 'outlined-contrast' // outlined button appearance with contrast background
    | 'flat-contrast'; // flat button appearance with contrast background

export type ButtonSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export type ButtonPin =
    | 'round-round'
    | 'brick-brick'
    | 'clear-clear'
    | 'circle-circle'
    | 'round-brick'
    | 'brick-round'
    | 'round-clear'
    | 'clear-round'
    | 'brick-clear'
    | 'clear-brick'
    | 'circle-brick'
    | 'brick-circle'
    | 'circle-clear'
    | 'clear-circle';

export type ButtonWidth = 'auto' | 'max';

interface ButtonCommonProps<T extends keyof React.JSX.IntrinsicElements> extends DOMProps, QAProps {
    view?: ButtonView;
    size?: ButtonSize;
    pin?: ButtonPin;
    selected?: boolean;
    disabled?: boolean;
    loading?: boolean;
    width?: ButtonWidth;
    title?: string;
    tabIndex?: number;
    id?: string;
    children?: React.ReactNode;
    onClick?: React.JSX.IntrinsicElements[T]['onClick'];
    onMouseEnter?: React.JSX.IntrinsicElements[T]['onMouseEnter'];
    onMouseLeave?: React.JSX.IntrinsicElements[T]['onMouseLeave'];
    onFocus?: React.JSX.IntrinsicElements[T]['onFocus'];
    onBlur?: React.JSX.IntrinsicElements[T]['onBlur'];
}

interface ButtonButtonProps extends ButtonCommonProps<'button'> {
    type?: 'button' | 'submit' | 'reset';
    extraProps?: React.JSX.IntrinsicElements['button'];
}

interface ButtonLinkProps extends ButtonCommonProps<'a'> {
    as: never;
    href: string;
    target?: string;
    rel?: string;
    extraProps?: React.JSX.IntrinsicElements['a'];
}

interface ButtonCustomProps<T extends keyof React.JSX.IntrinsicElements>
    extends ButtonCommonProps<T> {
    as: T;
    /**
     * @deprecated Use "as" prop instead
     */
    component?: T;
    extraProps?: React.JSX.IntrinsicElements[T];
}

export type ButtonProps<T extends keyof React.JSX.IntrinsicElements = any> =
    | ButtonButtonProps
    | ButtonLinkProps
    | ButtonCustomProps<T>;

const b = block('button');

const ButtonWithHandlers = React.forwardRef<HTMLElement, ButtonProps>(function Button(props, ref) {
    const {
        view = 'normal',
        size = 'm',
        pin = 'round-round',
        selected,
        disabled = false,
        loading = false,
        width,
        title,
        tabIndex,
        onClick,
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
        children,
        id,
        style,
        className,
        qa,
    } = props;
    const handleClickCapture = React.useCallback(
        (event: React.SyntheticEvent) => {
            eventBroker.publish({
                componentId: 'Button',
                eventId: 'click',
                domEvent: event,
                meta: {
                    content: event.currentTarget.textContent,
                    view,
                },
            });
        },
        [view],
    );

    const commonProps = {
        title,
        tabIndex,
        onClick,
        onClickCapture: handleClickCapture,
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
        id,
        style,
        className: b(
            {
                view,
                size,
                pin,
                selected,
                disabled: disabled || loading,
                loading,
                width,
            },
            className,
        ),
        'data-qa': qa,
    };
    const disabledProp = disabled || loading;
    const content = prepareChildren(children);

    if ('href' in props) {
        return (
            <a
                {...commonProps}
                ref={ref as React.Ref<HTMLAnchorElement>}
                href={props.href}
                target={props.target}
                rel={props.target === '_blank' && !props.rel ? 'noopener noreferrer' : props.rel}
                aria-disabled={disabledProp}
                {...props.extraProps}
            >
                {content}
            </a>
        );
    } else if ('as' in props) {
        return React.createElement(
            props.as || props.component,
            {
                ...commonProps,
                ref,
                'aria-disabled': disabledProp,
                ...props.extraProps,
            },
            content,
        );
    } else {
        return (
            <button
                {...commonProps}
                ref={ref as React.Ref<HTMLButtonElement>}
                type={props.type}
                disabled={disabledProp}
                aria-pressed={selected}
                {...props.extraProps}
            >
                {content}
            </button>
        );
    }
});

ButtonWithHandlers.displayName = 'Button';

export const Button = Object.assign(ButtonWithHandlers, {Icon: ButtonIcon});

const isButtonIconComponent = isOfType(ButtonIcon);

function prepareChildren(children: React.ReactNode) {
    const items = React.Children.toArray(children);

    if (items.length === 1) {
        const onlyItem = items[0];

        if (isButtonIconComponent(onlyItem)) {
            return onlyItem;
        } else if (isIcon(onlyItem)) {
            return <Button.Icon key="icon">{onlyItem}</Button.Icon>;
        } else {
            return (
                <span key="text" className={b('text')}>
                    {onlyItem}
                </span>
            );
        }
    } else {
        let leftIcon, rightIcon, text;
        const content = [];

        for (const item of items) {
            const isIconElement = isIcon(item);
            const isButtonIconElement = isButtonIconComponent(item);

            if (isIconElement || isButtonIconElement) {
                if (!leftIcon && content.length === 0) {
                    const key = 'icon-left';
                    const side = 'left';
                    if (isIconElement) {
                        leftIcon = (
                            <Button.Icon key={key} side={side}>
                                {item}
                            </Button.Icon>
                        );
                    } else {
                        leftIcon = React.cloneElement(item, {
                            side,
                        });
                    }
                } else if (!rightIcon && content.length !== 0) {
                    const key = 'icon-right';
                    const side = 'right';
                    if (isIconElement) {
                        rightIcon = (
                            <Button.Icon key={key} side={side}>
                                {item}
                            </Button.Icon>
                        );
                    } else {
                        rightIcon = React.cloneElement(item, {
                            side,
                        });
                    }
                }
            } else {
                content.push(item);
            }
        }

        if (content.length > 0) {
            text = (
                <span key="text" className={b('text')}>
                    {content}
                </span>
            );
        }

        return [leftIcon, rightIcon, text];
    }
}
