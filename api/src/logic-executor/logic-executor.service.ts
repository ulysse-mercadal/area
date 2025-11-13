import { Injectable, BadRequestException } from '@nestjs/common';

export interface LogicExecutionInput {
    condition?: any;
    input?: any;
    maxIterations?: number;
    incomingNodes?: Array<{
        status: string;
        output: any;
        executionChannel: string;
    }>;
}

export interface LogicExecutionResult {
    success: boolean;
    output: any;
    logs: string;
    channel: string;
}

@Injectable()
export class LogicExecutorService {
    async executeIf(input: LogicExecutionInput): Promise<LogicExecutionResult> {
        let logs = 'Executing IF logic node\n';
        try {
            const condition = this.evaluateCondition(input.condition, input.input);
            logs += `Condition evaluated to: ${condition}\n`;
            if (condition) {
                logs += 'Condition is TRUE, using "success" channel\n';
                return {
                    success: true,
                    output: input.input,
                    logs,
                    channel: 'success',
                };
            } else {
                logs += 'Condition is FALSE, using "failed" channel\n';
                return {
                    success: true,
                    output: input.input,
                    logs,
                    channel: 'failed',
                };
            }
        } catch (error: any) {
            logs += `Error: ${error.message}\n`;
            throw new BadRequestException(`IF execution failed: ${error.message}`);
        }
    }

    async executeAnd(input: LogicExecutionInput): Promise<LogicExecutionResult> {
        let logs = 'Executing AND logic node\n';
        try {
            if (!input.incomingNodes || input.incomingNodes.length === 0) {
                throw new BadRequestException('AND logic requires at least one incoming node');
            }
            logs += `Checking ${input.incomingNodes.length} incoming node(s)\n`;
            const allSuccess = input.incomingNodes.every((node, index) => {
                if (!node.executionChannel || node.executionChannel === 'unknown') {
                    logs += `Node ${index + 1} channel: UNKNOWN → FALSE (never executed)\n`;
                    return false;
                }
                const isSuccess = node.executionChannel === 'success';
                logs += `Node ${index + 1} channel: ${node.executionChannel} → ${isSuccess ? 'TRUE' : 'FALSE'}\n`;
                return isSuccess;
            });
            logs += `All nodes successful: ${allSuccess}\n`;
            const combinedOutput = input.incomingNodes.reduce((acc, node) => {
                return { ...acc, ...node.output };
            }, {});
            return {
                success: true,
                output: combinedOutput,
                logs,
                channel: allSuccess ? 'success' : 'failed',
            };
        } catch (error: any) {
            logs += `Error: ${error.message}\n`;
            throw new BadRequestException(`AND execution failed: ${error.message}`);
        }
    }

    async executeNot(input: LogicExecutionInput): Promise<LogicExecutionResult> {
        let logs = 'Executing NOT logic node\n';
        try {
            if (!input.incomingNodes || input.incomingNodes.length === 0) {
                throw new BadRequestException('NOT logic requires at least one incoming node');
            }
            const firstNode = input.incomingNodes[0];
            const isSuccess = firstNode.executionChannel === 'success';
            const result = !isSuccess;
            logs += `First incoming node channel: ${firstNode.executionChannel}\n`;
            logs += `Is success: ${isSuccess}\n`;
            logs += `Negated result: ${result}\n`;
            return {
                success: true,
                output: firstNode.output || input.input,
                logs,
                channel: result ? 'success' : 'failed',
            };
        } catch (error: any) {
            logs += `Error: ${error.message}\n`;
            throw new BadRequestException(`NOT execution failed: ${error.message}`);
        }
    }

    private evaluateCondition(condition: any, input: any): boolean {
        if (typeof condition === 'boolean') {
            return condition;
        }
        if (typeof condition === 'string') {
            try {
                let expr = condition;
                if (input && typeof input === 'object') {
                    Object.keys(input).forEach(key => {
                        const regex = new RegExp(`\\$\{${key}\}`, 'g');
                        expr = expr.replace(regex, JSON.stringify(input[key]));
                    });
                }
                if (expr.includes('>') || expr.includes('<') || expr.includes('==') || expr.includes('!=')) {
                    return eval(expr);
                }
                return !!expr;
            } catch {
                return false;
            }
        }
        if (typeof condition === 'object' && condition !== null) {
            if (condition.operator && condition.left !== undefined && condition.right !== undefined) {
                const left = this.resolveValue(condition.left, input);
                const right = this.resolveValue(condition.right, input);
                switch (condition.operator) {
                    case '==':
                    case '===':
                        return left === right;
                    case '!=':
                    case '!==':
                        return left !== right;
                    case '>':
                        return left > right;
                    case '<':
                        return left < right;
                    case '>=':
                        return left >= right;
                    case '<=':
                        return left <= right;
                    default:
                        return false;
                }
            }
        }
        return !!condition;
    }

    private resolveValue(value: any, input: any): any {
        if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
            const key = value.slice(2, -1);
            return input?.[key];
        }
        return value;
    }
}
