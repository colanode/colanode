import {
    parseOrderByExpression,
    type ParsedOrderBy,
    type SimpleComparison,
} from '@tanstack/react-db';

type AnyExpr = {
    type: 'func' | 'ref' | 'val';
    name?: string;
    args?: AnyExpr[];
    path?: Array<string | number>;
    value?: unknown;
};

const COMPARISON_OPS = new Set(['eq', 'gt', 'gte', 'lt', 'lte', 'in']);
const NULL_OPS = new Set(['isNull', 'isUndefined']);

const pushComparison = (
    out: SimpleComparison[],
    e: AnyExpr,
    prefix = ''
): void => {
    if (NULL_OPS.has(e.name!)) {
        const [fieldArg] = e.args ?? [];
        if (fieldArg?.type === 'ref' && fieldArg.path) {
            out.push({ field: fieldArg.path, operator: `${prefix}${e.name}` });
        }
        return;
    }
    if (COMPARISON_OPS.has(e.name!)) {
        const [leftArg, rightArg] = e.args ?? [];
        const field =
            leftArg?.type === 'ref' && leftArg.path ? leftArg.path : null;
        const value = rightArg?.type === 'val' ? rightArg.value : undefined;
        if (field && value !== undefined) {
            out.push({ field, operator: `${prefix}${e.name}`, value });
        }
    }
};

const extractLenient = (expr: AnyExpr | undefined | null): SimpleComparison[] => {
    if (!expr) return [];
    const out: SimpleComparison[] = [];
    const walk = (e: AnyExpr): void => {
        if (e.type !== 'func') return;
        if (e.name === 'and') {
            e.args?.forEach(walk);
            return;
        }
        if (e.name === 'not') {
            const [arg] = e.args ?? [];
            if (arg?.type === 'func') pushComparison(out, arg, 'not_');
            return;
        }
        pushComparison(out, e);
    };
    walk(expr);
    return out;
};

export const parseLoadSubsetOptionsLenient = (
    options:
        | { where?: unknown; orderBy?: unknown; limit?: number }
        | undefined
        | null
): { filters: SimpleComparison[]; sorts: ParsedOrderBy[]; limit?: number } => {
    if (!options) return { filters: [], sorts: [] };
    let sorts: ParsedOrderBy[] = [];
    try {
        sorts = parseOrderByExpression(options.orderBy as never);
    } catch {
        sorts = [];
    }
    return {
        filters: extractLenient(options.where as AnyExpr | undefined),
        sorts,
        limit: options.limit,
    };
};
