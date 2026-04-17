import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RoleBucketConfigView } from "./RoleBucketConfig";
import { GameMode, Team } from "@/lib/types";
import type { AdvancedRoleBucket, RoleDefinition } from "@/lib/types";
import { ROLE_BUCKET_CONFIG_COPY } from "./RoleBucketConfig.copy";

afterEach(cleanup);

const mockRoles: RoleDefinition<string, Team>[] = [
  { id: "villager", name: "Villager", team: Team.Good },
  { id: "werewolf", name: "Werewolf", team: Team.Bad },
  { id: "seer", name: "Seer", team: Team.Good, unique: true },
];

const defaultProps = {
  allRoles: mockRoles,
  gameMode: GameMode.Werewolf,
  disabled: false,
  onAddBucket: vi.fn(),
  onRemoveBucket: vi.fn(),
  onSetBucketName: vi.fn(),
  onSetBucketPlayerCount: vi.fn(),
  onAddRole: vi.fn(),
  onRemoveRole: vi.fn(),
  onSetBucketUnique: vi.fn(),
};

describe("RoleBucketConfigView", () => {
  it("renders the Add bucket button when no buckets are present", () => {
    render(<RoleBucketConfigView {...defaultProps} buckets={[]} />);
    expect(screen.getByText(ROLE_BUCKET_CONFIG_COPY.addBucket)).toBeDefined();
  });

  it("shows empty state message when a bucket has no roles", () => {
    const buckets: AdvancedRoleBucket[] = [{ playerCount: 2, roles: [] }];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(screen.getByText(ROLE_BUCKET_CONFIG_COPY.noRoles)).toBeDefined();
  });

  it("renders role names for roles added to a bucket", () => {
    const buckets: AdvancedRoleBucket[] = [
      {
        playerCount: 2,
        roles: [{ roleId: "villager" }, { roleId: "seer", max: 1 }],
      },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(screen.getByText("Villager")).toBeDefined();
    expect(screen.getByText("Seer")).toBeDefined();
  });

  it("uses bucket name as input placeholder when no name is set", () => {
    const buckets: AdvancedRoleBucket[] = [{ playerCount: 1, roles: [] }];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    const input = screen.getByPlaceholderText(
      ROLE_BUCKET_CONFIG_COPY.bucketNamePlaceholder(0),
    );
    expect(input).toBeDefined();
  });

  it("displays the bucket name when one is set", () => {
    const buckets: AdvancedRoleBucket[] = [
      { playerCount: 2, name: "Village", roles: [] },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    const input = screen.getByDisplayValue("Village");
    expect(input).toBeDefined();
  });

  it("renders one Remove bucket button per bucket", () => {
    const buckets: AdvancedRoleBucket[] = [
      { playerCount: 1, roles: [] },
      { playerCount: 2, roles: [] },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    const removeButtons = screen.getAllByText(
      ROLE_BUCKET_CONFIG_COPY.removeBucket,
    );
    expect(removeButtons).toHaveLength(2);
  });

  it("renders the add role dropdown only when unassigned roles exist", () => {
    const buckets: AdvancedRoleBucket[] = [
      {
        playerCount: 3,
        roles: [
          { roleId: "villager" },
          { roleId: "werewolf" },
          { roleId: "seer" },
        ],
      },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(screen.queryByText(ROLE_BUCKET_CONFIG_COPY.addRole)).toBeNull();
  });

  it("disables all interactive elements when disabled is true", () => {
    const buckets: AdvancedRoleBucket[] = [
      { playerCount: 1, roles: [{ roleId: "villager" }] },
    ];
    render(
      <RoleBucketConfigView
        {...defaultProps}
        buckets={buckets}
        disabled={true}
      />,
    );
    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button.getAttribute("disabled")).not.toBeNull();
    }
  });

  it("shows the Unique badge on inherently unique roles", () => {
    const buckets: AdvancedRoleBucket[] = [
      { playerCount: 2, roles: [{ roleId: "seer", max: 1 }] },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(screen.getByText(ROLE_BUCKET_CONFIG_COPY.uniqueBadge)).toBeDefined();
  });

  it("does not show the Unique badge on non-unique roles", () => {
    const buckets: AdvancedRoleBucket[] = [
      { playerCount: 2, roles: [{ roleId: "villager" }] },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(screen.queryByText(ROLE_BUCKET_CONFIG_COPY.uniqueBadge)).toBeNull();
  });

  it("shows the bucket-level unique toggle when non-unique roles are present", () => {
    const buckets: AdvancedRoleBucket[] = [
      { playerCount: 2, roles: [{ roleId: "villager" }] },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(
      screen.getByText(ROLE_BUCKET_CONFIG_COPY.bucketUnique),
    ).toBeDefined();
  });

  it("does not show the bucket-level unique toggle when only inherently unique roles are in the bucket", () => {
    const buckets: AdvancedRoleBucket[] = [
      { playerCount: 1, roles: [{ roleId: "seer", max: 1 }] },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(screen.queryByText(ROLE_BUCKET_CONFIG_COPY.bucketUnique)).toBeNull();
  });

  it("shows an insufficient capacity error when capped roles cannot fill playerCount", () => {
    const buckets: AdvancedRoleBucket[] = [
      {
        playerCount: 3,
        roles: [
          { roleId: "villager", max: 1 },
          { roleId: "werewolf", max: 1 },
        ],
      },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(
      screen.getByText(ROLE_BUCKET_CONFIG_COPY.errorInsufficientCapacity),
    ).toBeDefined();
  });

  it("does not show an insufficient capacity error when max capacity meets playerCount", () => {
    const buckets: AdvancedRoleBucket[] = [
      {
        playerCount: 2,
        roles: [
          { roleId: "villager", max: 1 },
          { roleId: "werewolf", max: 1 },
        ],
      },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(
      screen.queryByText(ROLE_BUCKET_CONFIG_COPY.errorInsufficientCapacity),
    ).toBeNull();
  });

  it("does not show an insufficient capacity error when a non-unique role provides unlimited capacity", () => {
    const buckets: AdvancedRoleBucket[] = [
      {
        playerCount: 5,
        roles: [{ roleId: "villager" }],
      },
    ];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(
      screen.queryByText(ROLE_BUCKET_CONFIG_COPY.errorInsufficientCapacity),
    ).toBeNull();
  });

  it("does not show an insufficient capacity error for an empty bucket", () => {
    const buckets: AdvancedRoleBucket[] = [{ playerCount: 2, roles: [] }];
    render(<RoleBucketConfigView {...defaultProps} buckets={buckets} />);
    expect(
      screen.queryByText(ROLE_BUCKET_CONFIG_COPY.errorInsufficientCapacity),
    ).toBeNull();
  });
});
