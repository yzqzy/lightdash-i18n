import { Anchor, Button, type ButtonProps } from '@mantine/core';
import React, { type FC } from 'react';
import { useNavigate } from 'react-router';
import { type EventData } from '../../providers/Tracking/types';
import useTracking from '../../providers/Tracking/useTracking';

export interface MantineLinkButtonProps extends ButtonProps {
    href: string;
    trackingEvent?: EventData;
    target?: React.HTMLAttributeAnchorTarget;
    forceRefresh?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const MantineLinkButton: FC<MantineLinkButtonProps> = ({
    href,
    target,
    trackingEvent,
    forceRefresh = false,
    onClick,
    ...rest
}) => {
    const navigate = useNavigate();
    const { track } = useTracking();

    return (
        <Anchor href={href} target={target} unstyled>
            <Button
                component="button"
                {...rest}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    if (
                        !forceRefresh &&
                        !e.ctrlKey &&
                        !e.metaKey &&
                        target !== '_blank'
                    ) {
                        e.preventDefault();
                        void navigate(href);
                    }

                    onClick?.(e);

                    if (trackingEvent) track(trackingEvent);
                }}
            />
        </Anchor>
    );
};

export default MantineLinkButton;
