import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('subscription_history')
export class SubscriptionHistory {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  contractor_id: string;

  @Column('varchar', { length: 36, nullable: true })
  subscription_plan_id: string;

  @Column({ type: 'timestamp', nullable: true })
  subscription_start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscription_end_date: Date;

  @Column({ nullable: true })
  subscription_status: string;

  @Column({ nullable: true })
  action: string; // 'assigned', 'extended', 'unassigned', 'expired'

  @Column({ nullable: true })
  action_performed_by: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Relations for querying (no foreign key constraints to avoid constraint errors)
  @ManyToOne(() => Profile, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'contractor_id' })
  contractor: Profile;

  @ManyToOne(() => SubscriptionPlan, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'subscription_plan_id' })
  subscription_plan: SubscriptionPlan;
}

