import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { Location } from './location.entity';

@Entity('sessions')
export class Session {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  vehicle_id: string;

  @Column('varchar', { length: 36 })
  location_id: string;

  @Column('timestamp')
  time_in: Date;

  @Column('timestamp', { nullable: true })
  time_out: Date;

  @Column()
  gate_in_id: string;

  @Column({ nullable: true })
  gate_out_id: string;

  @Column('decimal', { nullable: true })
  payment_amount: number;

  @Column({ nullable: true })
  payment_status: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  created_by: string;

  @Column({ nullable: true })
  updated_by: string;

  @Column({ nullable: true })
  deleted_by: string;

  @Column({ type: 'timestamp', nullable: true })
  deleted_on: Date;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn({ name: 'created_on' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  updated_on: Date;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicles: Vehicle;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  parking_locations: Location;
}

