import React from 'react';

import omit from 'lodash/omit';

import {PromiseDialogContext} from './PromiseDialogContext';
import type {DialogRendererProps, PromiseDialogResult} from './types';

type PromiseDialogProviderProps = {
    children: React.ReactNode | React.ReactNode[];
    onError: (error: unknown) => void;
};

export const PromiseDialogProvider = ({children, onError}: PromiseDialogProviderProps) => {
    const [dialogs, setDialogs] = React.useState<Record<number, React.ReactNode>>([]);
    const dialogsRef: React.MutableRefObject<Record<number, React.ReactNode>> =
        React.useRef(dialogs);

    React.useEffect(() => {
        dialogsRef.current = dialogs;
    }, [dialogs]);

    const contextValue = React.useMemo(
        () => ({
            openDialog: <ResultType extends unknown>(
                renderDialog: ({
                    onSuccess,
                    asyncOnSuccess,
                    onCancel,
                }: DialogRendererProps<ResultType>) => React.ReactNode,
            ) =>
                new Promise<{success: boolean; value?: ResultType}>((resolve) => {
                    const currentKeys = Object.keys(dialogsRef.current);

                    const key = parseInt(currentKeys[currentKeys.length - 1] || '0', 10) + 1;

                    const handleClose = (result: PromiseDialogResult<ResultType>) => {
                        setTimeout(() => {
                            setDialogs(omit(dialogsRef.current, key));
                        }, 100);

                        resolve(result);
                    };

                    const handleSuccess = (value: ResultType) => {
                        handleClose({success: true, value});
                    };

                    const handleSuccessPromise = (getValue: Promise<ResultType>) => {
                        getValue
                            .then((value) => {
                                handleClose({success: true, value});
                            })
                            .catch(onError);
                    };

                    const handleCancel = () => {
                        handleClose({success: false});
                    };

                    const dialog = renderDialog({
                        onSuccess: handleSuccess,
                        asyncOnSuccess: handleSuccessPromise,
                        onCancel: handleCancel,
                    });

                    setDialogs({
                        ...dialogsRef.current,
                        [key]: dialog,
                    });
                }),
        }),
        [onError],
    );

    return (
        <PromiseDialogContext.Provider value={contextValue}>
            {children}
            {Object.values(dialogs)}
        </PromiseDialogContext.Provider>
    );
};
