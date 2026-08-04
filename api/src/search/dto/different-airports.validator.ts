import type { ValidationArguments, ValidatorConstraintInterface } from 'class-validator';
import { ValidatorConstraint } from 'class-validator';

@ValidatorConstraint({ name: 'differentAirports', async: false })
export class DifferentAirportsConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const body = args.object as { origin?: string; destination?: string };

    if (!body.origin || !body.destination) {
      return true;
    }

    return body.origin !== body.destination;
  }

  defaultMessage(): string {
    return 'origin e destination devem ser diferentes';
  }
}
