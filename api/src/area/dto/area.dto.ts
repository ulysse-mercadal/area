import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParameterDto {
    @ApiProperty({
        description: 'Name of the parameter',
        example: 'email'
    })
    name: string;

    @ApiProperty({
        description: 'Type of the parameter',
        example: 'string'
    })
    type: string;

    @ApiProperty({
        description: 'Description of the parameter',
        example: 'Recipient email address'
    })
    description: string;

    @ApiProperty({
        description: 'Whether the parameter is required',
        example: true
    })
    required: boolean;
}

export class ActionDto {
    @ApiProperty({
        description: 'Action ID',
        example: 1
    })
    id: number;

    @ApiProperty({
        description: 'Name of the action',
        example: 'send_email'
    })
    name: string;

    @ApiProperty({
        description: 'Description of the action',
        example: 'Sends an email to the specified recipient'
    })
    description: string;

    @ApiProperty({
        description: 'Type of service',
        example: 'email'
    })
    serviceType: string;

    @ApiProperty({
        description: 'Action parameters',
        type: [ParameterDto],
        example: [
            {
                name: 'to',
                type: 'string',
                description: 'Recipient email address',
                required: true
            },
            {
                name: 'subject',
                type: 'string',
                description: 'Email subject',
                required: true
            }
        ]
    })
    parameters: ParameterDto[];

    @ApiProperty({
        description: 'Action output',
        type: [ParameterDto],
        example: [
            {
                name: 'messageId',
                type: 'string',
                description: 'ID of the sent message',
                required: true
            }
        ]
    })
    output: ParameterDto[];
}

export class ReactionDto {
    @ApiProperty({
        description: 'Reaction ID',
        example: 2
    })
    id: number;

    @ApiProperty({
        description: 'Name of the reaction',
        example: 'create_issue'
    })
    name: string;

    @ApiProperty({
        description: 'Description of the reaction',
        example: 'Creates a new issue in the repository'
    })
    description: string;

    @ApiProperty({
        description: 'Type of service',
        example: 'github'
    })
    serviceType: string;

    @ApiProperty({
        description: 'Reaction parameters',
        type: [ParameterDto],
        example: [
            {
                name: 'title',
                type: 'string',
                description: 'Issue title',
                required: true
            },
            {
                name: 'body',
                type: 'string',
                description: 'Issue description',
                required: false
            }
        ]
    })
    parameters: ParameterDto[];
}

export class ServiceAreasDto {
    @ApiProperty({
        description: 'Name of the service',
        example: 'Gmail'
    })
    serviceName: string;

    @ApiProperty({
        description: 'Available actions for the service',
        type: [ActionDto]
    })
    actions: ActionDto[];

    @ApiProperty({
        description: 'Available reactions for the service',
        type: [ReactionDto]
    })
    reactions: ReactionDto[];
}

export class AreaResponseDto {
    @ApiProperty({
        description: 'Available actions',
        type: [ActionDto]
    })
    actions: ActionDto[];

    @ApiProperty({
        description: 'Available reactions',
        type: [ReactionDto]
    })
    reactions: ReactionDto[];

    @ApiProperty({
        description: 'Services the user is not connected to',
        type: [ServiceAreasDto]
    })
    userNotConnectedTo: ServiceAreasDto[];
}
