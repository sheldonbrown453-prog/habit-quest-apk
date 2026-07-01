import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CheckCircle2, SkipForward, Zap, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XpFloat, LevelUpOverlay } from "@/components/XpFloat";
import { tierForLevel } from "../../../shared/rpg";

const ICONS = ["⚡", "🏃", "📚", "💧", "🧘", "💪", "🎯", "🌱", "🍎", "😴", "✍️", "🎵", "🧠", "❤️", "🌟", "🔥", "⚔️", "🛡️", "💎", "🏆"];
const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#06b6d4", "#84cc16", "#f97316"];
const CATEGORIES = ["General", "Health", "Fitness", "Learning", "Mindfulness", "Nutrition", "Sleep", "Productivity", "Social", "Creative"];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

interface HabitFormData {
  name: string;
  icon: string;
  color: string;
  category: string;
  frequency: "daily" | "weekly";
  xpReward: number;
  notes: string;
}

const DEFAULT_FORM: HabitFormData = {
  name: "",
  icon: "⚡",
  color: "#6366f1",
  category: "General",
  frequency: "daily",
  xpReward: 25,
  notes: "",
};

export default function Habits() {
  const today = useMemo(() => getTodayDate(), []);
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<HabitFormData>(DEFAULT_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [xpFloat, setXpFloat] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; tier: string; icon: string } | null>(null);
  const [filterCat, setFilterCat] = useState("All");

  const { data: habits, isLoading } = trpc.habits.list.useQuery();
  const { data: todayLogs } = trpc.habits.logsForDate.useQuery({ logDate: today });

  const createHabit = trpc.habits.create.useMutation({
    onSuccess: (data) => {
      utils.habits.list.invalidate();
      setShowForm(false);
      setForm(DEFAULT_FORM);
      toast.success("Habit created!");
      if (data.unlocked.length > 0) {
        data.unlocked.forEach((a) => toast.success(`Achievement: ${a.name}`, { icon: a.icon }));
      }
    },
  });

  const updateHabit = trpc.habits.update.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      setEditingId(null);
      setShowForm(false);
      setForm(DEFAULT_FORM);
      toast.success("Habit updated!");
    },
  });

  const deleteHabit = trpc.habits.delete.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      setDeleteId(null);
      toast.success("Habit deleted");
    },
  });

  const completeHabit = trpc.habits.complete.useMutation({
    onSuccess: (data) => {
      utils.habits.logsForDate.invalidate();
      utils.profile.get.invalidate();
      setXpFloat(data.xpEarned);
      if (data.leveledUp) {
        const tier = tierForLevel(data.newLevel);
        setLevelUp({ level: data.newLevel, tier: data.newTier, icon: tier.icon });
      }
      data.unlocked.forEach((a) => toast.success(`Achievement: ${a.name}`, { icon: a.icon }));
    },
  });

  const skipHabit = trpc.habits.skip.useMutation({
    onSuccess: () => {
      utils.habits.logsForDate.invalidate();
      toast.info("Skipped");
    },
  });

  const logMap = new Map(todayLogs?.map((l) => [l.habitId, l.status]));
  const categories = ["All", ...Array.from(new Set(habits?.map((h) => h.category) ?? []))];
  const filtered = habits?.filter((h) => filterCat === "All" || h.category === filterCat) ?? [];

  function openCreate() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(habit: typeof habits extends (infer T)[] | undefined ? T : never) {
    if (!habit) return;
    setEditingId((habit as any).id);
    setForm({
      name: (habit as any).name,
      icon: (habit as any).icon,
      color: (habit as any).color,
      category: (habit as any).category,
      frequency: (habit as any).frequency,
      xpReward: (habit as any).xpReward,
      notes: (habit as any).notes ?? "",
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Habit name is required");
    if (editingId) {
      updateHabit.mutate({ id: editingId, ...form });
    } else {
      createHabit.mutate(form);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {xpFloat !== null && <XpFloat amount={xpFloat} onDone={() => setXpFloat(null)} />}
      {levelUp && (
        <LevelUpOverlay level={levelUp.level} tier={levelUp.tier} tierIcon={levelUp.icon} onDone={() => setLevelUp(null)} />
      )}

      {/* Header */}
      <div className="bg-gradient-to-b from-card to-background px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">My Habits</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{habits?.length ?? 0} habits tracked</p>
          </div>
          <button
            onClick={openCreate}
            className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30 transition-all active:scale-95"
          >
            <Plus size={20} className="text-primary-foreground" />
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                filterCat === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Habit list */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-card rounded-2xl animate-pulse border border-border" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">⚔️</span>
            <p className="text-foreground font-semibold">No habits yet</p>
            <p className="text-muted-foreground text-sm mt-1">Create your first habit to begin your quest</p>
            <button
              onClick={openCreate}
              className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
            >
              <Plus size={16} />
              Create Habit
            </button>
          </div>
        ) : (
          filtered.map((habit) => {
            const status = logMap.get(habit.id);
            const isDone = status === "completed";
            const isSkipped = status === "skipped";

            return (
              <div
                key={habit.id}
                className={cn(
                  "bg-card border rounded-2xl p-4 transition-all duration-200",
                  isDone ? "border-green-500/30 bg-green-500/5" : "border-border",
                  isSkipped && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ backgroundColor: habit.color + "20", border: `1.5px solid ${habit.color}40` }}
                  >
                    {habit.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-semibold text-foreground", isDone && "line-through text-muted-foreground")}>
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-md text-muted-foreground">
                        {habit.category}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{habit.frequency}</span>
                      <span className="text-xs text-accent font-medium flex items-center gap-0.5">
                        <Zap size={9} />+{habit.xpReward} XP
                      </span>
                    </div>
                  </div>

                  {/* Edit/Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(habit)}
                      className="w-7 h-7 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-all"
                    >
                      <Pencil size={12} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteId(habit.id)}
                      className="w-7 h-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-all"
                    >
                      <Trash2 size={12} className="text-destructive" />
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                {habit.frequency === "daily" && !isDone && !isSkipped && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => skipHabit.mutate({ habitId: habit.id, logDate: today })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground text-sm font-medium transition-all"
                    >
                      <SkipForward size={14} />
                      Skip
                    </button>
                    <button
                      onClick={() => completeHabit.mutate({ habitId: habit.id, logDate: today })}
                      disabled={completeHabit.isPending}
                      className="flex-[2] flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 text-sm font-semibold transition-all"
                    >
                      <CheckCircle2 size={14} />
                      Complete
                    </button>
                  </div>
                )}
                {isDone && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-500/20">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Completed today</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { if (!v) { setShowForm(false); setEditingId(null); setForm(DEFAULT_FORM); } }}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {editingId ? "Edit Habit" : "Create Habit"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Habit Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Morning Run"
                className="bg-secondary border-border"
              />
            </div>

            {/* Icon picker */}
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setForm({ ...form, icon })}
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                      form.icon === icon ? "bg-primary/20 border-2 border-primary" : "bg-secondary border border-border hover:bg-secondary/80"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
                      form.color === color && "ring-2 ring-offset-2 ring-offset-card ring-white scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Category + Frequency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Frequency</Label>
                <Select value={form.frequency} onValueChange={(v: "daily" | "weekly") => setForm({ ...form, frequency: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* XP Reward */}
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">
                XP Reward: <span className="text-accent font-bold">{form.xpReward} XP</span>
              </Label>
              <div className="flex gap-2">
                {[10, 25, 50, 100].map((xp) => (
                  <button
                    key={xp}
                    onClick={() => setForm({ ...form, xpReward: xp })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                      form.xpReward === xp
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {xp}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Notes (optional)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes..."
                className="bg-secondary border-border"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createHabit.isPending || updateHabit.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl"
            >
              {editingId ? "Save Changes" : "Create Habit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Habit?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">This will permanently delete the habit and all its history.</p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteHabit.mutate({ id: deleteId })}
              disabled={deleteHabit.isPending}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
