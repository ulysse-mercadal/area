import { Controller, Post, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import * as logicExecutorService from './logic-executor.service';
import { LogicType } from '../nodes/dto/node.dto';

@Controller('workflow/execute')
export class LogicExecutorController {
    constructor(private readonly logicExecutorService: logicExecutorService.LogicExecutorService) {}

    @Post('if')
    async executeIf(@Body() input: logicExecutorService.LogicExecutionInput) {
        return this.logicExecutorService.executeIf(input);
    }

    @Post('and')
    async executeAnd(@Body() input: logicExecutorService.LogicExecutionInput) {
        return this.logicExecutorService.executeAnd(input);
    }

    @Post('not')
    async executeNot(@Body() input: logicExecutorService.LogicExecutionInput) {
        return this.logicExecutorService.executeNot(input);
    }

    @Post(':logicType')
    async executeLogic(
        @Param('logicType') logicType: string,
        @Body() input: logicExecutorService.LogicExecutionInput
    ) {
        const upperLogicType = logicType.toUpperCase();
        if (!Object.values(LogicType).includes(upperLogicType as LogicType)) {
            throw new BadRequestException(
                `Invalid logic type: ${logicType}. Valid types are: ${Object.values(LogicType).join(', ')}`
            );
        }
        switch (upperLogicType as LogicType) {
            case LogicType.IF:
                return this.logicExecutorService.executeIf(input);
            case LogicType.AND:
                return this.logicExecutorService.executeAnd(input);
            case LogicType.NOT:
                return this.logicExecutorService.executeNot(input);
            default:
                throw new BadRequestException(`Logic type ${upperLogicType} not implemented`);
        }
    }
}
