import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Location } from './location.entity';

@Entity('contractors')
export class Contractor {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  user_id: string;

  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  contact_number: string;

  @Column('int', { nullable: true })
  allowed_locations: number;

  @Column('int', { nullable: true })
  allowed_attendants_per_location: number;

  @Column('json', { nullable: true })
  rates_2wheeler: any;

  @Column('json', { nullable: true })
  rates_4wheeler: any;

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

  @OneToOne(() => Profile)
  @JoinColumn({ name: 'user_id' })
  profiles: Profile;

  @OneToMany(() => Location, (location) => location.contractors)
  parking_locations: Location[];
}

