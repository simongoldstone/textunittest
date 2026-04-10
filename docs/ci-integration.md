# CI Integration

TextUnitTest is intended to fit naturally into build pipelines that need to validate generated text assets.

## GitHub Actions

Planned usage:

```yaml
- run: textunittest validate tests/
```

## Azure DevOps

Planned usage:

```yaml
- script: textunittest validate tests/
```

## Notes

- Keep test suites in version control with the files they validate.
- Use clear `Fail:` messages so CI logs remain understandable to both technical and non-technical reviewers.
- Add TextUnitTest after the step that generates the text output you want to validate.
