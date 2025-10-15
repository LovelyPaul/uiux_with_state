# Claude Subagents

이 디렉토리는 특정 작업을 위한 전문화된 Claude subagent를 정의하는 곳입니다.

## Subagent 생성 방법

각 subagent는 마크다운 파일로 정의하며, 파일명이 subagent의 이름이 됩니다.

### 예시 구조

```
.claude/agents/
├── README.md
├── code-reviewer.md      # 코드 리뷰를 위한 subagent
├── test-writer.md        # 테스트 작성을 위한 subagent
└── refactoring.md        # 리팩토링을 위한 subagent
```

### Subagent 파일 형식

각 마크다운 파일에는 해당 subagent의 역할, 책임, 가이드라인을 작성합니다.

```markdown
# [Subagent 이름]

## 역할
이 agent의 주요 역할과 목적

## 책임
- 구체적인 책임 1
- 구체적인 책임 2

## 가이드라인
- 작업 시 따라야 할 규칙
- 특정 도구나 방법론 사용 지침
```

## 사용 방법

Task tool을 사용할 때 특정 subagent의 컨텍스트가 필요한 경우, 해당 파일의 내용을 참조합니다.
