

function resolvedDispatcher(){
    const dispatcher = ReactCurrentDispatcher.current;
    return dispatcher;
}

export function useState(initialState){
    const dispatcher = resolvedDispatcher();
    return dispatcher.useState(initialState);
}