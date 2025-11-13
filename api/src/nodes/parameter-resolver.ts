export interface ParameterSource {
    config?: any;
    input?: any;
}

export function resolveValue(path: string, data: any): any {
    if (!path || !data) return undefined;
    if (!path.includes('.')) {
        return data[path];
    }
    const keys = path.split('.');
    let current = data;
    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[key];
    }
    return current;
}

export function resolveParameters(
    parameterMapping: Record<string, string>,
    sources: ParameterSource
): Record<string, any> {
    const resolved: Record<string, any> = {};
    for (const [paramName, sourcePath] of Object.entries(parameterMapping)) {
        if (sourcePath.startsWith('config.')) {
            const path = sourcePath.replace('config.', '');
            resolved[paramName] = resolveValue(path, sources.config);
        } else if (sourcePath.startsWith('input.')) {
            const path = sourcePath.replace('input.', '');
            resolved[paramName] = resolveValue(path, sources.input);
        } else {
            resolved[paramName] =
                resolveValue(sourcePath, sources.config) ??
                resolveValue(sourcePath, sources.input);
        }
    }

    return resolved;
}

export function mergeConfigAndInput(config: any, input: any): any {
    return {
        ...input,
        ...config,
    };
}
