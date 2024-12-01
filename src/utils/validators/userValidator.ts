import { UserRegistrationData, UserLoginData } from "@/types/user";
import { ErrorObject } from "@/types/general";

export function userRegistrationValidator(
  data: UserRegistrationData
): [boolean, ErrorObject] {
  let errors: ErrorObject = {};
  if (!data.email) {
    errors.email = "Email is required";
  }
  if (!data.password) {
    errors.password = "Password is required";
  }
  if (!data.firstName) {
    errors.firstName = "First name is required";
  }
  if (!data.lastName) {
    errors.lastName = "Last name is required";
  }

  const hasErrors = Object.keys(errors).length > 0;
  return [hasErrors, errors];
}

export function userLoginValidator(
  data: UserLoginData
): [boolean, ErrorObject] {
  let errors: ErrorObject = {};
  if (!data.email) {
    errors.email = "Email is required";
  }
  if (!data.password) {
    errors.password = "Password is required";
  }

  return [Object.keys(errors).length !== 0, errors];
}
