import { forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  type TextInput as RNTextInputType,
  type TextInputProps
} from 'react-native';

export const TextInput = forwardRef<RNTextInputType, TextInputProps>(function TextInput(
  props,
  ref
) {
  return <RNTextInput ref={ref} {...props} />;
});
